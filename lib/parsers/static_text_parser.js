'use strict';

const Types = require('../constants/types.js');
const Charsets = require('../constants/charsets.js');
const helpers = require('../helpers');
const LocalDate = require('./local_date.js');

const typeNames = [];
for (const t in Types) {
  typeNames[Types[t]] = t;
}

// Resolved once per result set, as the compiled parser does at compile time:
// the per-row loop only calls one reader per field.
function readerFor(field, config, options) {
  const supportBigNumbers = Boolean(
    options.supportBigNumbers || config.supportBigNumbers
  );
  const bigNumberStrings = Boolean(
    options.bigNumberStrings || config.bigNumberStrings
  );
  const timezone = options.timezone || config.timezone;
  const dateStrings = options.dateStrings || config.dateStrings;
  const type = field.columnType;
  const encoding = field.encoding;

  // MariaDB sends JSON values as LONGTEXT; the JSON type is only visible in
  // the extended metadata (MARIADB_CLIENT_EXTENDED_METADATA capability)
  if (field.extendedFormat === 'json') {
    return config.jsonStrings
      ? (packet) => packet.readLengthCodedString(encoding)
      : (packet) => packet.parseJson(encoding, supportBigNumbers);
  }

  switch (type) {
    case Types.TINY:
    case Types.SHORT:
    case Types.LONG:
    case Types.INT24:
    case Types.YEAR:
      return (packet) => packet.parseLengthCodedIntNoBigCheck();
    case Types.LONGLONG:
      if (supportBigNumbers && bigNumberStrings) {
        return (packet) => packet.parseLengthCodedIntString();
      }
      return (packet) => packet.parseLengthCodedInt(supportBigNumbers);
    case Types.FLOAT:
    case Types.DOUBLE:
      return (packet) => packet.parseLengthCodedFloat();
    case Types.NULL:
    case Types.DECIMAL:
    case Types.NEWDECIMAL:
      if (config.decimalNumbers) {
        return (packet) => packet.parseLengthCodedFloat();
      }
      return (packet) => packet.readLengthCodedString('ascii');
    case Types.DATE:
      if (helpers.typeMatch(type, dateStrings, Types)) {
        return (packet) => packet.readLengthCodedString('ascii');
      }
      return (packet) => packet.parseDate(timezone);
    case Types.DATETIME:
    case Types.TIMESTAMP:
      if (helpers.typeMatch(type, dateStrings, Types)) {
        return (packet) => packet.readLengthCodedString('ascii');
      }
      return (packet) => packet.parseDateTime(timezone);
    case Types.TIME:
      return (packet) => packet.readLengthCodedString('ascii');
    case Types.GEOMETRY:
      return (packet) => packet.parseGeometryValue();
    case Types.VECTOR:
      return (packet) => packet.parseVector();
    case Types.JSON:
      // Since for JSON columns mysql always returns charset 63 (BINARY),
      // we have to handle it according to JSON specs and use "utf8",
      // see https://github.com/sidorares/node-mysql2/issues/409
      return config.jsonStrings
        ? (packet) => packet.readLengthCodedString('utf8')
        : (packet) => packet.parseJson('utf8', supportBigNumbers);
    default:
      if (field.characterSet === Charsets.BINARY) {
        return (packet) => packet.readLengthCodedBuffer();
      }
      return (packet) => packet.readLengthCodedString(encoding);
  }
}

function createTypecastField(field, packet) {
  return {
    type: typeNames[field.columnType],
    extendedTypeName: field.extendedTypeName,
    extendedFormat: field.extendedFormat,
    length: field.columnLength,
    db: field.schema,
    table: field.table,
    name: field.name,
    string: function (encoding = field.encoding) {
      if (field.columnType === Types.JSON && encoding === field.encoding) {
        // Since for JSON columns mysql always returns charset 63 (BINARY),
        // we have to handle it according to JSON specs and use "utf8",
        // see https://github.com/sidorares/node-mysql2/issues/1661
        console.warn(
          `typeCast: JSON column "${field.name}" is interpreted as BINARY by default, recommended to manually set utf8 encoding: \`field.string("utf8")\``
        );
      }
      return packet.readLengthCodedString(encoding);
    },
    buffer: function () {
      return packet.readLengthCodedBuffer();
    },
    geometry: function () {
      return packet.parseGeometryValue();
    },
  };
}

function getTextParser(fields, options, config) {
  if (fields.some((field) => LocalDate.usesLocalDate(field, options, config))) {
    LocalDate.checkTimezone();
  }

  const fieldCount = fields.length;
  const readers = fields.map((field) => readerFor(field, config, options));
  const typeCast = options.typeCast ? options.typeCast : config.typeCast;
  const rawBuffers = options.typeCast === false;
  const castFn = typeof typeCast === 'function' ? typeCast : null;
  const rowsAsArray = Boolean(options.rowsAsArray);
  const nestPrefix =
    typeof options.nestTables === 'string' ? options.nestTables : null;
  const nestByTable =
    !rowsAsArray && !nestPrefix && Boolean(options.nestTables);

  // Thrown from next(), where a reserved field name has always been reported.
  let keys = null;
  let tables = null;
  let keyError = null;
  if (!rowsAsArray) {
    try {
      if (nestPrefix !== null) {
        keys = fields.map(
          (field) =>
            `${helpers.fieldEscape(field.table, false)}${nestPrefix}${helpers.fieldEscape(field.name, false)}`
        );
      } else {
        keys = fields.map((field) => helpers.fieldEscape(field.name, false));
        if (nestByTable) {
          tables = fields.map((field) =>
            helpers.fieldEscape(field.table, false)
          );
        }
      }
    } catch (err) {
      keyError = err;
    }
  }

  const valueAt = (packet, i) => {
    if (rawBuffers) return packet.readLengthCodedBuffer();
    if (castFn !== null) {
      const field = fields[i];
      return castFn(createTypecastField(field, packet), () =>
        readers[i](packet)
      );
    }
    return readers[i](packet);
  };

  return {
    next(packet, _fields, _options) {
      if (keyError !== null) throw keyError;
      if (rowsAsArray) {
        const result = [];
        for (let i = 0; i < fieldCount; i++) result.push(valueAt(packet, i));
        return result;
      }
      const result = {};
      if (nestByTable) {
        for (let i = 0; i < fieldCount; i++) {
          const value = valueAt(packet, i);
          const table = tables[i];
          if (!result[table]) result[table] = {};
          result[table][keys[i]] = value;
        }
        return result;
      }
      for (let i = 0; i < fieldCount; i++) result[keys[i]] = valueAt(packet, i);
      return result;
    },
  };
}

module.exports = getTextParser;

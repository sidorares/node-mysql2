'use strict';

const Types = require('../constants/types.js');
const Charsets = require('../constants/charsets.js');
const helpers = require('../helpers');

const typeNames = [];
for (const t in Types) {
  typeNames[Types[t]] = t;
}

function readField({ packet, type, charset, encoding, config, options }) {
  const supportBigNumbers =
    options.supportBigNumbers || config.supportBigNumbers;
  const bigNumberStrings = options.bigNumberStrings || config.bigNumberStrings;
  const timezone = options.timezone || config.timezone;
  const dateStrings = options.dateStrings || config.dateStrings;

  switch (type) {
    case Types.TINY:
    case Types.SHORT:
    case Types.LONG:
    case Types.INT24:
    case Types.YEAR:
      return packet.parseLengthCodedIntNoBigCheck();
    case Types.LONGLONG:
      if (supportBigNumbers && bigNumberStrings) {
        return packet.parseLengthCodedIntString();
      }
      return packet.parseLengthCodedInt(supportBigNumbers);
    case Types.FLOAT:
    case Types.DOUBLE:
      return packet.parseLengthCodedFloat();
    case Types.NULL:
    case Types.DECIMAL:
    case Types.NEWDECIMAL:
      if (config.decimalNumbers) {
        return packet.parseLengthCodedFloat();
      }
      return packet.readLengthCodedString("ascii");
    case Types.DATE:
      if (helpers.typeMatch(type, dateStrings, Types)) {
        return packet.readLengthCodedString("ascii");
      }
      return packet.parseDate(timezone);
    case Types.DATETIME:
    case Types.TIMESTAMP:
      if (helpers.typeMatch(type, dateStrings, Types)) {
        return packet.readLengthCodedString('ascii');
      }
      return packet.parseDateTime(timezone);
    case Types.TIME:
      return packet.readLengthCodedString('ascii');
    case Types.GEOMETRY:
      return packet.parseGeometryValue();
    case Types.JSON:
      // Since for JSON columns mysql always returns charset 63 (BINARY),
      // we have to handle it according to JSON specs and use "utf8",
      // see https://github.com/sidorares/node-mysql2/issues/409
      return JSON.parse(packet.readLengthCodedString('utf8'));
    default:
      if (charset === Charsets.BINARY) {
        return packet.readLengthCodedBuffer();
      }
      return packet.readLengthCodedString(encoding);
  }
}

function compile(fields, options, config) {
  if (
    typeof config.typeCast === 'function' &&
    typeof options.typeCast !== 'function'
  ) {
    options.typeCast = config.typeCast;
  }
}

function createTypecastField(field, packet) {
  return {
    type: typeNames[field.columnType],
    length: field.columnLength,
    db: field.schema,
    table: field.table,
    name: field.name,
    string: function(encoding = field.encoding) {
      if (field.columnType === Types.JSON && encoding === field.encoding) {
        // Since for JSON columns mysql always returns charset 63 (BINARY),
        // we have to handle it according to JSON specs and use "utf8",
        // see https://github.com/sidorares/node-mysql2/issues/1661
        console.warn(`typeCast: JSON column "${field.name}" is interpreted as BINARY by default, recommended to manually set utf8 encoding: \`field.string("utf8")\``);
      }
      return packet.readLengthCodedString(encoding);
    },
    buffer: function() {
      return packet.readLengthCodedBuffer();
    },
    geometry: function() {
      return packet.parseGeometryValue();
    }
  };
}

function getTextParser(fields, options, config) {
  return {
    next(packet, fields, options) {
      const result = options.rowsAsArray ? [] : {};
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const typeCast = options.typeCast ? options.typeCast : config.typeCast;
        const next = () => {
          return readField({
            packet,
            type: field.columnType,
            encoding: field.encoding,
            charset: field.characterSet,
            config,
            options
          })
        }
        let value;
        if (typeof typeCast === 'function') {
          value = typeCast(createTypecastField(field, packet), next);
        } else {
          value = next();
        }
        if (options.rowsAsArray) {
          result.push(value);
        } else if (options.nestTables) {
          if (!result[field.table]) {
            result[field.table] = {};
          }
          result[field.table][field.name] = value;
        } else {
          result[field.name] = value;
        }
      }
      return result;
    }
  }
}

module.exports = getTextParser;

'use strict';

const Types = require('../constants/types.js');
const Charsets = require('../constants/charsets.js');
const helpers = require('../helpers');
const genFunc = require('generate-function');
const parserCache = require('./parser_cache.js');

const typeNames = [];
for (const t in Types) {
  typeNames[Types[t]] = t;
}

function readCodeFor(type, charset, encodingExpr, config, options) {
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
      return 'packet.parseLengthCodedIntNoBigCheck()';
    case Types.LONGLONG:
      if (supportBigNumbers && bigNumberStrings) {
        return 'packet.parseLengthCodedIntString()';
      }
      return `packet.parseLengthCodedInt(${supportBigNumbers})`;
    case Types.FLOAT:
    case Types.DOUBLE:
      return 'packet.parseLengthCodedFloat()';
    case Types.NULL:
      return 'packet.readLengthCodedNumber()';
    case Types.DECIMAL:
    case Types.NEWDECIMAL:
      if (config.decimalNumbers) {
        return 'packet.parseLengthCodedFloat()';
      }
      return 'packet.readLengthCodedString("ascii")';
    case Types.DATE:
      if (helpers.typeMatch(type, dateStrings, Types)) {
        return 'packet.readLengthCodedString("ascii")';
      }
      return `packet.parseDate('${timezone}')`;
    case Types.DATETIME:
    case Types.TIMESTAMP:
      if (helpers.typeMatch(type, dateStrings, Types)) {
        return 'packet.readLengthCodedString("ascii")';
      }
      return `packet.parseDateTime('${timezone}')`;
    case Types.TIME:
      return 'packet.readLengthCodedString("ascii")';
    case Types.GEOMETRY:
      return 'packet.parseGeometryValue()';
    case Types.JSON:
      // Since for JSON columns mysql always returns charset 63 (BINARY),
      // we have to handle it according to JSON specs and use "utf8",
      // see https://github.com/sidorares/node-mysql2/issues/409
      return 'JSON.parse(packet.readLengthCodedString("utf8"))';
    default:
      if (charset === Charsets.BINARY) {
        return 'packet.readLengthCodedBuffer()';
      }
      return `packet.readLengthCodedString(${encodingExpr})`;
  }
}

function compile(fields, options, config) {
  // use global typeCast if current query doesn't specify one
  if (
    typeof config.typeCast === 'function' &&
    typeof options.typeCast !== 'function'
  ) {
    options.typeCast = config.typeCast;
  }

  const parserFn = genFunc();

  /* eslint-disable no-trailing-spaces */
  /* eslint-disable no-spaced-func */
  /* eslint-disable no-unexpected-multiline */
  parserFn('(function () {')(
    'return class TextRow {'
  );

  // constructor method
  parserFn('constructor() {');
  // node-mysql typeCast compatibility wrapper
  // see https://github.com/mysqljs/mysql/blob/96fdd0566b654436624e2375c7b6604b1f50f825/lib/protocol/packets/Field.js
  if (typeof options.typeCast === 'function') {
    parserFn('const _this = this;');
    for(let i=0; i<fields.length; ++i) {
      const field = fields[i];
      const encodingExpr = helpers.srcEscape(field.encoding);
      const readCode = readCodeFor(
        fields[i].columnType,
        fields[i].characterSet,
        encodingExpr,
        config,
        options
      );
      parserFn(`this.wrap${i} = {
        type: ${helpers.srcEscape(typeNames[field.columnType])},
        length: ${helpers.srcEscape(field.columnLength)},
        db: ${helpers.srcEscape(field.schema)},
        table: ${helpers.srcEscape(field.table)},
        name: ${helpers.srcEscape(field.name)},
        string: function() {
          return _this.packet.readLengthCodedString(${encodingExpr});
        },
        buffer: function() {
          return _this.packet.readLengthCodedBuffer();
        },
        geometry: function() {
          return _this.packet.parseGeometryValue();
        },
        readNext: function() {
          const packet = _this.packet;
          return ${readCode};
        }
      };`);
    }
  }
  parserFn('}');

  // next method
  parserFn('next(packet, fields, options) {');
  parserFn("this.packet = packet;");
  if (options.rowsAsArray) {
    parserFn(`const result = new Array(${fields.length});`);
  } else {
    parserFn("const result = {};");
  }

  const resultTables = {};
  let resultTablesArray = [];

  if (options.nestTables === true) {
    for (let i=0; i < fields.length; i++) {
      resultTables[fields[i].table] = 1;
    }
    resultTablesArray = Object.keys(resultTables);
    for (let i=0; i < resultTablesArray.length; i++) {
      parserFn(`result[${helpers.srcEscape(resultTablesArray[i])}] = {};`);
    }
  }

  let lvalue = '';
  let fieldName = '';
  for (let i = 0; i < fields.length; i++) {
    fieldName = helpers.srcEscape(fields[i].name);
    parserFn(`// ${fieldName}: ${typeNames[fields[i].columnType]}`);
    if (typeof options.nestTables === 'string') {
      lvalue = `result[${helpers.srcEscape(
        fields[i].table + options.nestTables + fields[i].name
      )}]`;
    } else if (options.nestTables === true) {
      lvalue = `result[${helpers.srcEscape(fields[i].table)}][${fieldName}]`;
    } else if (options.rowsAsArray) {
      lvalue = `result[${i.toString(10)}]`;
    } else {
      lvalue = `result[${fieldName}]`;
    }
    if (typeof options.typeCast === 'function') {
      parserFn(`${lvalue} = options.typeCast(this.wrap${i}, this.wrap${i}.readNext);`);
    } else if (options.typeCast === false) {
      parserFn(`${lvalue} = packet.readLengthCodedBuffer();`);
    } else {
      const encodingExpr = `fields[${i}].encoding`;
      const readCode = readCodeFor(
        fields[i].columnType,
        fields[i].characterSet,
        encodingExpr,
        config,
        options
      );
      parserFn(`${lvalue} = ${readCode};`);
    }
  }

  parserFn('return result;');
  parserFn('}');
  parserFn('};')('})()');

  /* eslint-enable no-trailing-spaces */
  /* eslint-enable no-spaced-func */
  /* eslint-enable no-unexpected-multiline */

  if (config.debug) {
    helpers.printDebugWithCode(
      'Compiled text protocol row parser',
      parserFn.toString()
    );
  }
  return parserFn.toFunction();
}

function getTextParser(fields, options, config) {
  return parserCache.getParser('text', fields, options, config, compile);
}

module.exports = getTextParser;

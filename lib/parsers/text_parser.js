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
      return 'packet.parseLengthCodedInt(' + supportBigNumbers + ')';
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
      if (config.dateStrings) {
        return 'packet.readLengthCodedString("ascii")';
      }
      return 'packet.parseDate()';
    case Types.DATETIME:
    case Types.TIMESTAMP:
      if (config.dateStrings) {
        return 'packet.readLengthCodedString("ascii")';
      }
      return 'packet.parseDateTime()';
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
      if (charset == Charsets.BINARY) {
        return 'packet.readLengthCodedBuffer()';
      } else {
        return 'packet.readLengthCodedString(' + encodingExpr + ')';
      }
  }
}

function compile(fields, options, config) {
  // node-mysql typeCast compatibility wrapper
  // see https://github.com/mysqljs/mysql/blob/96fdd0566b654436624e2375c7b6604b1f50f825/lib/protocol/packets/Field.js
  function wrap(field, type, packet, encoding) {
    return {
      type: type,
      length: field.columnLength,
      db: field.schema,
      table: field.table,
      name: field.name,
      string: function() {
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

  // use global typeCast if current query doesn't specify one
  if (
    typeof config.typeCast === 'function' &&
    typeof options.typeCast !== 'function'
  ) {
    options.typeCast = config.typeCast;
  }

  const parserFn = genFunc();
  let i = 0;

  /* eslint-disable no-trailing-spaces */
  /* eslint-disable no-spaced-func */
  /* eslint-disable no-unexpected-multiline */
  parserFn('(function () {')(
    'return function TextRow(packet, fields, options, CharsetToEncoding) {'
  );

  if (options.rowsAsArray) {
    parserFn('const result = new Array(' + fields.length + ')');
  }

  if (typeof options.typeCast === 'function') {
    parserFn('const wrap = ' + wrap.toString());
  }

  const resultTables = {};
  let resultTablesArray = [];

  if (options.nestTables === true) {
    for (i = 0; i < fields.length; i++) {
      resultTables[fields[i].table] = 1;
    }
    resultTablesArray = Object.keys(resultTables);
    for (i = 0; i < resultTablesArray.length; i++) {
      parserFn('this[' + helpers.srcEscape(resultTablesArray[i]) + '] = {};');
    }
  }

  let lvalue = '';
  let fieldName = '';
  for (i = 0; i < fields.length; i++) {
    fieldName = helpers.srcEscape(fields[i].name);
    parserFn('// ' + fieldName + ': ' + typeNames[fields[i].columnType]);
    if (typeof options.nestTables == 'string') {
      lvalue =
        'this[' +
        helpers.srcEscape(
          fields[i].table + options.nestTables + fields[i].name
        ) +
        ']';
    } else if (options.nestTables === true) {
      lvalue =
        'this[' + helpers.srcEscape(fields[i].table) + '][' + fieldName + ']';
    } else if (options.rowsAsArray) {
      lvalue = 'result[' + i.toString(10) + ']';
    } else {
      lvalue = 'this[' + fieldName + ']';
    }
    const encodingExpr = 'CharsetToEncoding[fields[' + i + '].characterSet]';
    const readCode = readCodeFor(
      fields[i].columnType,
      fields[i].characterSet,
      encodingExpr,
      config,
      options
    );
    if (typeof options.typeCast === 'function') {
      parserFn(
        lvalue +
          ' = options.typeCast(wrap(fields[' +
          i +
          '], ' +
          helpers.srcEscape(typeNames[fields[i].columnType]) +
          ', packet, ' +
          encodingExpr +
          '), function() { return ' +
          readCode +
          ';})'
      );
    } else if (options.typeCast === false) {
      parserFn(lvalue + ' = packet.readLengthCodedBuffer();');
    } else {
      parserFn(lvalue + ' = ' + readCode + ';');
    }
  }

  if (options.rowsAsArray) {
    parserFn('return result;');
  }

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

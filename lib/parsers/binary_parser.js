'use strict';

const FieldFlags = require('../constants/field_flags.js');
const Charsets = require('../constants/charsets.js');
const Types = require('../constants/types.js');
const { srcEscape, printDebugWithCode } = require('../helpers');
const genFunc = require('generate-function');
const parserCache = require('./parser_cache.js');
const typeNames = [];
for (const t in Types) {
  typeNames[Types[t]] = t;
}

function readCodeFor(field, config, options, fieldNum) {
  const supportBigNumbers =
    options.supportBigNumbers || config.supportBigNumbers;
  const bigNumberStrings = options.bigNumberStrings || config.bigNumberStrings;
  const unsigned = field.flags & FieldFlags.UNSIGNED;
  switch (field.columnType) {
    case Types.TINY:
      return unsigned ? 'packet.readInt8();' : 'packet.readSInt8();';
    case Types.SHORT:
      return unsigned ? 'packet.readInt16();' : 'packet.readSInt16();';
    case Types.LONG:
    case Types.INT24: // in binary protocol int24 is encoded in 4 bytes int32
      return unsigned ? 'packet.readInt32();' : 'packet.readSInt32();';
    case Types.YEAR:
      return 'packet.readInt16()';
    case Types.FLOAT:
      return 'packet.readFloat();';
    case Types.DOUBLE:
      return 'packet.readDouble();';
    case Types.NULL:
      return 'null;';
    case Types.DATE:
    case Types.DATETIME:
    case Types.TIMESTAMP:
    case Types.NEWDATE:
      if (config.dateStrings) {
        return 'packet.readDateTimeString(' + field.decimals + ');';
      }
      return 'packet.readDateTime();';
    case Types.TIME:
      return 'packet.readTimeString()';
    case Types.DECIMAL:
    case Types.NEWDECIMAL:
      if (config.decimalNumbers) {
        return 'packet.parseLengthCodedFloat();';
      }
      return 'packet.readLengthCodedString("ascii");';
    case Types.GEOMETRY:
      return 'packet.parseGeometryValue();';
    case Types.JSON:
      // Since for JSON columns mysql always returns charset 63 (BINARY),
      // we have to handle it according to JSON specs and use "utf8",
      // see https://github.com/sidorares/node-mysql2/issues/409
      return 'JSON.parse(packet.readLengthCodedString("utf8"));';
    case Types.LONGLONG:
      if (!supportBigNumbers) {
        return unsigned
          ? 'packet.readInt64JSNumber();'
          : 'packet.readSInt64JSNumber();';
      } else {
        if (bigNumberStrings) {
          return unsigned
            ? 'packet.readInt64String();'
            : 'packet.readSInt64String();';
        } else {
          return unsigned ? 'packet.readInt64();' : 'packet.readSInt64();';
        }
      }
    default:
      if (field.characterSet == Charsets.BINARY) {
        return 'packet.readLengthCodedBuffer();';
      } else {
        return (
          'packet.readLengthCodedString(CharsetToEncoding[fields[' +
          fieldNum +
          '].characterSet])'
        );
      }
  }
}

function compile(fields, options, config) {
  const parserFn = genFunc();
  let i = 0;
  const nullBitmapLength = Math.floor((fields.length + 7 + 2) / 8);

  /* eslint-disable no-trailing-spaces */
  /* eslint-disable no-spaced-func */
  /* eslint-disable no-unexpected-multiline */

  parserFn('(function(){')(
    'return function BinaryRow(packet, fields, options, CharsetToEncoding) {'
  );

  if (options.rowsAsArray) {
    parserFn('const result = new Array(' + fields.length + ');');
  }

  const resultTables = {};
  let resultTablesArray = [];

  if (options.nestTables === true) {
    for (i = 0; i < fields.length; i++) {
      resultTables[fields[i].table] = 1;
    }
    resultTablesArray = Object.keys(resultTables);
    for (i = 0; i < resultTablesArray.length; i++) {
      parserFn('this[' + srcEscape(resultTablesArray[i]) + '] = {};');
    }
  }

  parserFn('packet.readInt8();'); // status byte
  for (i = 0; i < nullBitmapLength; ++i) {
    parserFn('const nullBitmaskByte' + i + ' = packet.readInt8();');
  }

  let lvalue = '';
  let currentFieldNullBit = 4;
  let nullByteIndex = 0;
  let fieldName = '';
  let tableName = '';

  for (i = 0; i < fields.length; i++) {
    fieldName = srcEscape(fields[i].name);
    parserFn('// ' + fieldName + ': ' + typeNames[fields[i].columnType]);

    if (typeof options.nestTables == 'string') {
      tableName = srcEscape(fields[i].table);
      lvalue =
        'this[' +
        srcEscape(fields[i].table + options.nestTables + fields[i].name) +
        ']';
    } else if (options.nestTables === true) {
      tableName = srcEscape(fields[i].table);
      lvalue = 'this[' + tableName + '][' + fieldName + ']';
    } else if (options.rowsAsArray) {
      lvalue = 'result[' + i.toString(10) + ']';
    } else {
      lvalue = 'this[' + srcEscape(fields[i].name) + ']';
    }

    // TODO: this used to be an optimisation ( if column marked as NOT_NULL don't include code to check null
    // bitmap at all, but it seems that we can't rely on this flag, see #178
    // TODO: benchmark performance difference
    //
    // if (fields[i].flags & FieldFlags.NOT_NULL) { // don't need to check null bitmap if field can't be null.
    //  result.push(lvalue + ' = ' + readCodeFor(fields[i], config));
    // } else if (fields[i].columnType == Types.NULL) {
    //  result.push(lvalue + ' = null;');
    // } else {
    parserFn(
      'if (nullBitmaskByte' + nullByteIndex + ' & ' + currentFieldNullBit + ')'
    );
    parserFn(lvalue + ' = null;');
    parserFn('else');
    parserFn(lvalue + ' = ' + readCodeFor(fields[i], config, options, i));
    // }
    currentFieldNullBit *= 2;
    if (currentFieldNullBit == 0x100) {
      currentFieldNullBit = 1;
      nullByteIndex++;
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
    printDebugWithCode(
      'Compiled binary protocol row parser',
      parserFn.toString()
    );
  }
  return parserFn.toFunction();
}

function getBinaryParser(fields, options, config) {
  return parserCache.getParser('binary', fields, options, config, compile);
}

module.exports = getBinaryParser;

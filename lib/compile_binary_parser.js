var vm = require('vm');

var FieldFlags = require('./constants/field_flags.js');
var Charsets = require('./constants/charsets.js');
var Types = require('./constants/types.js');
var srcEscape = require('./helpers').srcEscape;

var typeNames = [];
for (var t in Types) {
  typeNames[Types[t]] = t;
}

function compile (fields, options, config) {
  var result = [];
  var i = 0;
  var nullBitmapLength = Math.floor((fields.length + 7 + 2) / 8);
  result.push('(function(){ return function BinaryRow(packet) {');

  if (options.rowsAsArray) {
    result.push('  var result = new Array(' + fields.length + ');');
  }

  var resultTables = {};
  var resultTablesArray = [];

  if (options.nestTables === true) {
    for (i = 0; i < fields.length; i++) {
      resultTables[fields[i].table] = 1;
    }
    resultTablesArray = Object.keys(resultTables);
    for (i = 0; i < resultTablesArray.length; i++) {
      result.push('  this[' + srcEscape(resultTablesArray[i]) + '] = {};');
    }
  }

  result.push('  var statusByte = packet.readInt8();');
  for (i = 0; i < nullBitmapLength; ++i) {
    result.push('  var nullBitmaskByte' + i + ' = packet.readInt8();');
  }

  var lvalue = '';
  var currentFieldNullBit = 4;
  var nullByteIndex = 0;
  var fieldName = '';
  var tableName = '';

  for (i = 0; i < fields.length; i++) {
    fieldName = srcEscape(fields[i].name);
    result.push('  // ' + fieldName + ': ' + typeNames[fields[i].columnType]);

    if (typeof options.nestTables == 'string') {
      tableName = srcEscape(fields[i].table);
      lvalue = ['  this[', srcEscape(fields[i].table + options.nestTables + fields[i].name), ']'].join('');
    } else if (options.nestTables === true) {
      tableName = srcEscape(fields[i].table);
      lvalue = ['  this[', tableName, '][', fieldName, ']'].join('');
    } else if (options.rowsAsArray) {
      lvalue = '  result[' + i.toString(10) + ']';
    } else {
      lvalue = '  this[' + srcEscape(fields[i].name) + ']';
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
    result.push('  if (nullBitmaskByte' + nullByteIndex + ' & ' + currentFieldNullBit + ')');
    result.push('  ' + lvalue + ' = null;');
    result.push('  else');
    result.push('  ' + lvalue + ' = ' + readCodeFor(fields[i], config));
    // }
    currentFieldNullBit *= 2;
    if (currentFieldNullBit == 0x100) {
      currentFieldNullBit = 1;
      nullByteIndex++;
    }
  }

  if (options.rowsAsArray) {
    result.push('  return result;');
  }

  result.push('}; })()');
  var src = result.join('\n');
  if (config.debug) {
    console.log('Compiled binary protocol row parser:');
    var cardinal = require('cardinal');
    console.log(cardinal.highlight(src));
  }
  return vm.runInThisContext(src);
}

function readCodeFor (field, config) {
  var unsigned = field.flags & FieldFlags.UNSIGNED;
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
      return 'packet.readDateTimeString();';
    }
    return 'packet.readDateTime();';
  case Types.TIME:
    return 'packet.readTimeString()';
  case Types.DECIMAL:
  case Types.NEWDECIMAL:
    if (config.decimalNumbers) {
      return 'packet.parseLengthCodedFloat();';
    }
    return 'packet.readLengthCodedString();';
  case Types.GEOMETRY:
    return 'packet.parseGeometryValue();';
  case Types.JSON:
    return 'JSON.parse(packet.readLengthCodedString());';
  case Types.LONGLONG: // TODO: 8 bytes. Implement as two 4 bytes read for now (it's out of JavaScript int precision!)
    return unsigned ? 'packet.readInt64();' : 'packet.readSInt64();';
  default:
    if (field.characterSet == Charsets.BINARY) {
      return 'packet.readLengthCodedBuffer();';
    } else {
      return 'packet.readLengthCodedString();';
    }
  }
}

module.exports = compile;

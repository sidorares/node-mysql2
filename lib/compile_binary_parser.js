var FieldFlags = require('./constants/field_flags');
var Charsets = require('./constants/charsets');
var Types = require('./constants/types');
var vm = require('vm');
var srcEscape = require('./helpers').srcEscape;

function compile(fields) {
  var result = [];
  var i=0;
  var j=0;
  var nullBitmapLength = Math.floor((fields.length + 7 + 2) / 8);
  result.push('(function(){ return function BinaryRow(packet) {');
  result.push('  var statusByte = packet.readInt8();');
  for (j=0; j < nullBitmapLength; ++j)
    result.push('  var nullBitmaskByte' + j + ' = packet.readInt8();');

  var currentFieldNullBit = 4;
  var nullByteIndex = 0;
  for (i = 0; i < fields.length; i++) {
    //result.push('  // type = ' + fields[i].columnType + ' flags = ' + fields[i].flags);
    if (fields[i].flags & FieldFlags.NOT_NULL) { // don't need to check null bitmap if field can't be null.
      result.push('  this[' + srcEscape(fields[i].name) + '] = ' + readCodeFor(fields[i]));
    } else if (fields[i].columnType == Types.NULL) {
      result.push('  this[\'' + fields[i].name + '\'] = null;');
    } else {
      result.push('  if (nullBitmaskByte' + nullByteIndex  + ' & ' + currentFieldNullBit + ')');
      result.push('    this[\'' + fields[i].name + '\'] = null;');
      result.push('  else');
      result.push('    this[\'' + fields[i].name + '\'] = ' + readCodeFor(fields[i]));
    }
    currentFieldNullBit *= 2;
    if (currentFieldNullBit == 0x100)
    {
      currentFieldNullBit = 1;
      nullByteIndex++;
    }
  }
  result.push('}; })()');
  var src = result.join('\n');
  return vm.runInThisContext(src);
}

function readCodeFor(field) {
  var unsigned = field.flags & FieldFlags.UNSIGNED;
  switch(field.columnType) {
  case Types.TINY:
    return unsigned ? "packet.readInt8();" : "packet.readSInt8();";
  case Types.SHORT:
    return unsigned ? "packet.readInt16();" : "packet.readSInt16();";
  case Types.LONG:
  case Types.INT24: // in binary protocol int24 is encoded in 4 bytes int32
    return unsigned ? "packet.readInt32();" : "packet.readSInt32();";
  case Types.YEAR:
    return "\'not implemented\';";
  case Types.FLOAT:
    return "packet.readFloat();";
  case Types.DOUBLE:
    return "packet.readDouble();";
  case Types.NULL:
    return "null;";
  case Types.DATETIME:
    return "packet.readDateTime();";
  case Types.DECIMAL:
  case Types.NEWDECIMAL:
    return "packet.readLengthCodedString();";
  case Types.LONGLONG: // TODO: 8 bytes. Implement as two 4 bytes read for now (it's out of JavaScript int precision!)
    return unsigned ? "packet.readInt64();" : "packet.readSInt64();";
  default:
    if (field.characterSet == Charsets.BINARY)
      return "packet.readLengthCodedBuffer();";
    else
      return "packet.readLengthCodedString();";
  }
}

module.exports = compile;

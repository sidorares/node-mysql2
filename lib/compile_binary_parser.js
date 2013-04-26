var constants = require('./constants');
var vm = require('vm');

function compile(fields) {
  var result = [];
  var i=0;
  var j=0;
  var nullBitmapLength = Math.floor((fields.length + 7 + 2) / 8);
  result.push('function BinaryRow(packet) {');
    result.push('  var statusByte = packet.readInt8();');
  for (j=0; j < nullBitmapLength; ++j)
    result.push('  var nullBitmaskByte' + j + ' = packet.readInt8();');

  var currentFieldNullBit = 4;
  var nullByteIndex = 0;
  for (i = 0; i < fields.length; i++) {
    //result.push('  // type = ' + fields[i].columnType + ' flags = ' + fields[i].flags);
    if (fields[i].flags & constants.FIELD_NOT_NULL) { // don't need to check null bitmap if field can't be null.
      result.push('  this[\'' + fields[i].name + '\'] = ' + readCodeFor(fields[i].columnType, fields[i].flags));
    } else if (fields[i].columnType == constants.MYSQL_TYPE_NULL) {
      result.push('  this[\'' + fields[i].name + '\'] = null;');
    } else {
      result.push('  if (nullBitmaskByte' + nullByteIndex  + ' & ' + currentFieldNullBit + ')');
      result.push('    this[\'' + fields[i].name + '\'] = null;');
      result.push('  else');
      result.push('    this[\'' + fields[i].name + '\'] = ' + readCodeFor(fields[i].columnType, fields[i].flags));
    }
    currentFieldNullBit *= 2;
    if (currentFieldNullBit == 0x100)
    {
      currentFieldNullBit = 1;
      nullByteIndex++;
    }
  }
  result.push('} BinaryRow;');
  var src = result.join('\n');
  return vm.runInNewContext(src);
}

function readCodeFor(type, flags) {
  switch(type) {
  case constants.MYSQL_TYPE_TINY:
    return "packet.readInt8();";
  case constants.MYSQL_TYPE_SHORT:
    return "packet.readInt16();";
  case constants.MYSQL_TYPE_LONG:
  case constants.MYSQL_TYPE_INT24: // in binary protocol int24 is encoded in 4 bytes int32
    return "packet.readInt32();";
  case constants.MYSQL_TYPE_YEAR:
    return "\'not implemented\';";
  case constants.MYSQL_TYPE_FLOAT:
    return "packet.readFloat();";
  case constants.MYSQL_TYPE_DOUBLE:
    return "packet.readDouble();";
  case constants.MYSQL_TYPE_NULL:
    return "null;";
  case constants.MYSQL_TYPE_DATETIME:
    return "packet.readDateTime();";
  case constants.MYSQL_TYPE_LONGLONG: // TODO: 8 bytes. Implement as 4 bytes read for now
    return "packet.readInt32() + 0xffffffff*packet.readInt32();";
  default:
    return "packet.readLengthCodedString();";
  }
}

module.exports = compile;

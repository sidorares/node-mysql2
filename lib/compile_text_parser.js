var Types = require('./constants/types');
var vm = require('vm');

function compile(fields) {
  var result = [];
  var i=0;
  result.push('function TextRow(packet) {');
  for (i = 0; i < fields.length; i++) {
    result.push('  this[\'' + fields[i].name + '\'] = ' + readCodeFor(fields[i].columnType));
  }
  result.push('} TextRow;');
  var src = result.join('\n');
  return vm.runInNewContext(src);
}

function readCodeFor(type) {
  switch(type) {
  case Types.TINY:
  case Types.SHORT:
  case Types.LONG:
  case Types.INT24:
  case Types.YEAR:
    return "packet.parseLengthCodedInt();";
  case Types.FLOAT:
  case Types.DOUBLE:
    return "packet.parseLengthCodedFloat();";
  case Types.NULL:
    return "null; packet.skip(1);";
  default:
    return "packet.readLengthCodedString(); //" + type;
  }
}

module.exports = compile;

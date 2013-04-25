var constants = require('./constants');
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
  case constants.MYSQL_TYPE_TINY:
  case constants.MYSQL_TYPE_SHORT:
  case constants.MYSQL_TYPE_LONG:
  case constants.MYSQL_TYPE_INT24:
  case constants.MYSQL_TYPE_YEAR:
    return "packet.parseLengthCodedInt();";
  case constants.MYSQL_TYPE_FLOAT:
  case constants.MYSQL_TYPE_DOUBLE:
    return "packet.parseLengthCodedFloat();";
  case constants.MYSQL_TYPE_NULL:
    return "null;";
  default:
    return "packet.readLengthCodedString(); //" + type;
  }
}

module.exports = compile;

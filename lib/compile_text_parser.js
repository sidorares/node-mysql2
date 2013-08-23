var Types = require('./constants/types');
var Charsets = require('./constants/charsets');
var vm = require('vm');
var srcEscape = require('./helpers').srcEscape;

function compile(fields) {
  var result = [];
  var i=0;

  result.push('(function() { return function TextRow(packet) {');
  for (i = 0; i < fields.length; i++) {
    result.push('  this['+ srcEscape(fields[i].name) + '] = ' + readCodeFor(fields[i].columnType, fields[i].characterSet));
  }
  result.push('};})()');
  var src = result.join('\n');
  return vm.runInThisContext(src);
}

function readCodeFor(type, charset) {
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
  case Types.LONG:
  case Types.LONGLONG:
  case Types.DECIMAL:
  case Types.NEWDECIMAL:
    return "packet.readLengthCodedString(); //" + type + ' ' + charset;
  case Types.DATETIME:
    return "new Date(packet.readLengthCodedString());";
  default:
    if (charset == Charsets.BINARY)
      return "packet.readLengthCodedBuffer();";
    else
      return "packet.readLengthCodedString(); //" + type + ' ' + charset;
  }
}

module.exports = compile;

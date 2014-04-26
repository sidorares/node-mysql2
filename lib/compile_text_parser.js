var Types = require('./constants/types');
var Charsets = require('./constants/charsets');
var vm = require('vm');
var srcEscape = require('./helpers').srcEscape;

var typeNames = [];
for (var t in Types) {
  typeNames[Types[t]] = t;
}

function compile(fields) {

  var result = [];
  var i=0;

  result.push('(function() { return function TextRow(packet) {');
  for (i = 0; i < fields.length; i++) {
    //debug: uncomment to see each column metadata as comment
    //result.push('  // ' + typeNames[fields[i].columnType] + ': ' + JSON.stringify(fields[i]));
    result.push('  this['+ srcEscape(fields[i].name) + '] = ' + readCodeFor(fields[i].columnType, fields[i].characterSet));
  }
  result.push('};})()');
  var src = result.join('\n');
  //console.log(src);
  return vm.runInThisContext(src);
}

function readCodeFor(type, charset) {
  switch(type) {
  case Types.TINY:
  case Types.SHORT:
  case Types.LONG:
  case Types.INT24:
  case Types.YEAR:
  case Types.LONG:
  case Types.LONGLONG:
    return "packet.parseLengthCodedInt();";
  case Types.FLOAT:
  case Types.DOUBLE:
    return "packet.parseLengthCodedFloat();";
  case Types.NULL:
    return "null; packet.skip(1);";
  case Types.DECIMAL:
  case Types.NEWDECIMAL:
    return "packet.readLengthCodedString(); //" + type + ' ' + charset;
  case Types.DATE:
    return "packet.parseDate();";
  case Types.DATETIME:
  case Types.TIMESTAMP:
    return "packet.parseDateTime();";
  case Types.TIME:
    return "packet.readLengthCodedString()";
  case Types.GEOMETRY:
    return "packet.parseGeometryValue();";
  default:
    if (charset == Charsets.BINARY)
      return "packet.readLengthCodedBuffer();";
    else
      return "packet.readLengthCodedString(); //" + type + ' ' + charset;
  }
}

module.exports = compile;

var Types = require('./constants/types');
var Charsets = require('./constants/charsets');
var vm = require('vm');
var srcEscape = require('./helpers').srcEscape;

var typeNames = [];
for (var t in Types) {
  typeNames[Types[t]] = t;
}

function compile(fields, options, config) {

  var result = [];
  var i=0;
  var lvalue = '';

  result.push('(function() { return function TextRow(packet) {');
  if (options.rowsAsArray)
    result.push('  var result = new Array(' + fields.length + ')');

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

  var fieldName = '';
  var tableName = '';
  for (i = 0; i < fields.length; i++) {
    fieldName = srcEscape(fields[i].name);
    result.push('  // ' + fieldName + ': '+ typeNames[fields[i].columnType]);
    if (typeof options.nestTables == 'string') {
      tableName = srcEscape(fields[i].table);
      lvalue = ['  this[', srcEscape(fields[i].table + options.nestTables + fields[i].name), ']'].join('');
    } else if (options.nestTables === true) {
      tableName = srcEscape(fields[i].table);
      lvalue = ['  this[', tableName, '][', fieldName, ']'].join('');
    } else if (options.rowsAsArray) {
      lvalue = '  result[' + i.toString(10) + ']';
    } else
      lvalue = '  this[' + srcEscape(fields[i].name) + ']';
    result.push(lvalue + ' = ' + readCodeFor(fields[i].columnType, fields[i].characterSet, config));
  }

  if (options.rowsAsArray)
    result.push('  return result;');

  result.push('};})()');
  var src = result.join('\n');
  if (config.debug) {
    console.log('        Compiled text protocol row parser:\n\n');
    var cardinal = require('cardinal');
    console.log(cardinal.highlight(src) + '\n\n');
  }
  return vm.runInThisContext(src);
}

function readCodeFor(type, charset, config) {
  switch(type) {
  case Types.TINY:
  case Types.SHORT:
  case Types.LONG:
  case Types.INT24:
  case Types.YEAR:
  case Types.LONG:
    return "packet.parseLengthCodedInt();";
  case Types.LONGLONG:
    if (config.supportBigNumbers && config.bigNumberStrings) {
      return "packet.parseLengthCodedIntString();";
    }
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
    if (config.dateStrings)
      return "packet.readLengthCodedString()";
    return "packet.parseDate();";
  case Types.DATETIME:
  case Types.TIMESTAMP:
    if (config.dateStrings)
      return "packet.readLengthCodedString()";
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

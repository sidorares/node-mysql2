var Types = require('./constants/types.js');
var Charsets = require('./constants/charsets.js');
var CharsetToEncoding = require('./constants/charset_encodings.js');
var vm = require('vm');
var srcEscape = require('./helpers').srcEscape;

var typeNames = [];
for (var t in Types) {
  typeNames[Types[t]] = t;
}


function compile (fields, options, config) {

  // node-mysql typeCast compatibility wrapper
  // see https://github.com/mysqljs/mysql/blob/96fdd0566b654436624e2375c7b6604b1f50f825/lib/protocol/packets/Field.js
  function wrap (field, type, packet, encoding) {
    return {
      type: type,
      length: field.columnLength,
      db: field.schema,
      table: field.table,
      name: field.name,
      string: function () { return packet.readLengthCodedString(encoding); },
      buffer: function () { return packet.readLengthCodedBuffer(); },
      geometry: function () { return packet.parseGeometryValue(); }
    };
  }

  var result = [];
  var i = 0;
  var lvalue = '';

  result.push('(function() { return function TextRow(packet, fields, options, CharsetToEncoding) {');
  if (options.rowsAsArray) {
    result.push('  var result = new Array(' + fields.length + ')');
  }

  // use global typeCast if current query doesn't specify one
  if (typeof config.typeCast === 'function' && typeof options.typeCast !== 'function') {
    options.typeCast = config.typeCast;
  }

  if (typeof options.typeCast === 'function') {
    result.push('  var wrap = ' + wrap.toString());
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
    var encodingExpr = 'CharsetToEncoding[fields[' + i + '].characterSet]';
    var readCode = readCodeFor(fields[i].columnType, fields[i].characterSet, encodingExpr, config, options);
    if (typeof options.typeCast === 'function') {
      result.push(lvalue + ' = options.typeCast(wrap(fields[' + i + '], ' + srcEscape(typeNames[fields[i].columnType]) + ', packet, ' + encodingExpr + '), function() { return ' + readCode + ';})');
    } else if (options.typeCast === false) {
      result.push(lvalue + ' = packet.readLengthCodedBuffer();');
    } else {
      result.push(lvalue + ' = ' + readCode);
    }
  }

  if (options.rowsAsArray) {
    result.push('  return result;');
  }

  result.push('};})()');
  var src = result.join('\n');
  if (config.debug) {
    console.log('        Compiled text protocol row parser:\n\n');
    console.log(src);
    var cardinal = require('cardinal');
    console.log(cardinal.highlight(src) + '\n\n');
  }
  return vm.runInThisContext(src);
}

function readCodeFor (type, charset, encodingExpr, config, options) {
  var supportBigNumbers = options.supportBigNumbers || config.supportBigNumbers;
  var bigNumberStrings = options.bigNumberStrings || config.bigNumberStrings;

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
    return 'null; packet.skip(1)';
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
    return 'JSON.parse(packet.readLengthCodedString(' + encodingExpr + '))';
  default:
    if (charset == Charsets.BINARY) {
      return 'packet.readLengthCodedBuffer()';
    } else {
      return 'packet.readLengthCodedString(' + encodingExpr + ')';
    }
  }
}

module.exports = compile;

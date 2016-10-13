var FieldFlags = require('./constants/field_flags.js');
var Charsets = require('./constants/charsets.js');
var CharsetToEncoding = require('./constants/charset_encodings.js');
var Types = require('./constants/types.js');
var srcEscape = require('./helpers').srcEscape;
var genFunc = require('generate-function');

var typeNames = [];
for (var t in Types) {
  typeNames[Types[t]] = t;
}

function compile (fields, options, config) {
  var parserFn = genFunc();
  var i = 0;
  var nullBitmapLength = Math.floor((fields.length + 7 + 2) / 8);

  /* eslint-disable no-trailing-spaces */
  /* eslint-disable no-spaced-func */
  /* eslint-disable no-unexpected-multiline */

  parserFn('(function(){')
              ('return function BinaryRow(packet, fields, options, CharsetToEncoding) {');

  if (options.rowsAsArray) {
    parserFn('var result = new Array(' + fields.length + ');');
  }

  var resultTables = {};
  var resultTablesArray = [];

  if (options.nestTables === true) {
    for (i = 0; i < fields.length; i++) {
      resultTables[fields[i].table] = 1;
    }
    resultTablesArray = Object.keys(resultTables);
    for (i = 0; i < resultTablesArray.length; i++) {
      parserFn('this[' + srcEscape(resultTablesArray[i]) + '] = {};');
    }
  }
  
  // If we're processing dots, we need to pre-declare all objects that are used
  if (options.processDots === true && !options.nestTables && !options.rowsAsArray) {
    
	var allObjects = [];
	
	// Process each field containing a .
    for (i = 0; i < fields.length; i++) {
      if (fields[i].name.indexOf('.') != -1) {
        var fieldNames = fields[i].name.split('.');
        if(fieldNames.length > 1) {
			
		  // Remove the actual field name
          fieldNames.pop();

		  // Escape each part of the field path
		  fieldNames.forEach(function (part, index, namesArray) {
			  namesArray[index] = srcEscape(part);
		  });
          
		  allObjects.push(fieldNames);
        }
      }
    }

    if (allObjects.length > 0) {
      // Make sure the objects are sorted so they're declared in the correct order
      allObjects.sort();
      for (i = 0; i < allObjects.length; ++i) {
        var fieldNames = allObjects[i];
        result.push('  this[' + fieldNames.join('][') + '] = {};');
      }
    }
  }

  parserFn('var statusByte = packet.readInt8();');
  for (i = 0; i < nullBitmapLength; ++i) {
    parserFn('var nullBitmaskByte' + i + ' = packet.readInt8();');
  }

  var lvalue = '';
  var currentFieldNullBit = 4;
  var nullByteIndex = 0;
  var fieldName = '';
  var tableName = '';

  for (i = 0; i < fields.length; i++) {
    fieldName = srcEscape(fields[i].name);
    parserFn('// ' + fieldName + ': ' + typeNames[fields[i].columnType]);

    if (typeof options.nestTables == 'string') {
      tableName = srcEscape(fields[i].table);
      lvalue = 'this[' + srcEscape(fields[i].table + options.nestTables + fields[i].name) + ']';
    } else if (options.nestTables === true) {
      tableName = srcEscape(fields[i].table);
      lvalue = 'this[' + tableName + '][' + fieldName + ']';
    } else if (options.rowsAsArray) {
      lvalue = 'result[' + i.toString(10) + ']';
	} else if (options.processDots && fields[i].name.indexOf('.') != -1) {
      var fieldNames = fields[i].name.split('.');
      fieldNames.forEach(function(part, index, namesArray) {
        namesArray[index] = srcEscape(part);
      });
      lvalue = 'this[' + fieldNames.join('][') + ']';
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
    parserFn('if (nullBitmaskByte' + nullByteIndex + ' & ' + currentFieldNullBit + ')');
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

  parserFn('};')
      ('})()');

  /* eslint-enable no-trailing-spaces */
  /* eslint-enable no-spaced-func */
  /* eslint-enable no-unexpected-multiline */

  if (config.debug) {
    console.log('\n\nCompiled binary protocol row parser:\n');
    var cardinal = require('cardinal');
    console.log(cardinal.highlight(parserFn.toString()) + '\n');
  }
  return parserFn.toFunction();
}

function readCodeFor (field, config, options, fieldNum) {
  var supportBigNumbers = options.supportBigNumbers || config.supportBigNumbers;
  var bigNumberStrings = options.bigNumberStrings || config.bigNumberStrings;
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
      return unsigned ? 'packet.readInt64JSNumber();' : 'packet.readSInt64JSNumber();';
    } else {
      if (bigNumberStrings) {
        return unsigned ? 'packet.readInt64String();' : 'packet.readSInt64String();';
      } else {
        return unsigned ? 'packet.readInt64();' : 'packet.readSInt64();';
      }
    }
  default:
    if (field.characterSet == Charsets.BINARY) {
      return 'packet.readLengthCodedBuffer();';
    } else {
      return 'packet.readLengthCodedString(CharsetToEncoding[fields[' + fieldNum + '].characterSet])';
    }
  }
}

module.exports = compile;

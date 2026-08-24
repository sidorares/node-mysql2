'use strict';

const Types = require('../constants/types');
const Packet = require('../packets/packet');
const StringParser = require('../parsers/string.js');
const {
  TypedParameter,
  encodeTypedParameter,
  integerHint,
} = require('./typed_parameter.js');
const FieldFlags = require('../constants/field_flags.js');

function isJSON(value) {
  return (
    Array.isArray(value) ||
    value.constructor === Object ||
    (typeof value.toJSON === 'function' && !Buffer.isBuffer(value))
  );
}

function toParameter(value, encoding, timezone, jsonAsString, hint) {
  if (value instanceof TypedParameter) {
    return encodeTypedParameter(value, encoding, timezone, jsonAsString);
  }
  if (hint) {
    const hinted = integerHint(
      value,
      hint.columnType,
      Boolean(hint.flags & FieldFlags.UNSIGNED)
    );
    if (hinted) {
      return encodeTypedParameter(hinted, encoding, timezone, jsonAsString);
    }
  }
  let type = Types.VAR_STRING;
  let length;
  let writer = Packet.prototype.writeLengthCodedBuffer;
  if (value !== null) {
    switch (typeof value) {
      case 'undefined':
        throw new TypeError('Bind parameters must not contain undefined');

      case 'number':
        type = Types.DOUBLE;
        length = 8;
        writer = Packet.prototype.writeDouble;
        break;

      case 'boolean':
        value = value | 0;
        type = Types.TINY;
        length = 1;
        writer = Packet.prototype.writeInt8;
        break;

      case 'object':
        if (Object.prototype.toString.call(value) === '[object Date]') {
          type = Types.DATETIME;
          length = 12;
          writer = function (value) {
            return Packet.prototype.writeDate.call(this, value, timezone);
          };
        } else if (isJSON(value)) {
          value = JSON.stringify(value);
          // MariaDB rejects the JSON parameter type with "Incorrect
          // arguments to mysqld_stmt_execute"; it expects JSON values
          // as plain strings
          if (!jsonAsString) {
            type = Types.JSON;
          }
        } else if (Buffer.isBuffer(value)) {
          // send buffers as BLOB so servers treat the value as binary data
          // rather than a string in the connection charset (MariaDB converts
          // string parameters when storing into binary columns such as
          // VECTOR, corrupting the value)
          type = Types.BLOB;
          length = Packet.lengthCodedNumberLength(value.length) + value.length;
          writer = Packet.prototype.writeLengthCodedBuffer;
        }
        break;

      default:
        value = value.toString();
    }
  } else {
    value = '';
    type = Types.NULL;
    length = 0;
    writer = writeNothing;
  }
  let byteLength;
  if (length === undefined) {
    // a non-string here (e.g. a Uint8Array) keeps the Buffer.from coercion
    // inside StringParser.encode
    if (
      typeof value === 'string' &&
      StringParser.hasFastUtf8Write &&
      (encoding === 'utf8' || encoding === 'utf-8')
    ) {
      byteLength = Buffer.byteLength(value, 'utf8');
      length = Packet.lengthCodedNumberLength(byteLength) + byteLength;
      writer = Packet.prototype.writeLengthCodedUtf8String;
    } else {
      value = StringParser.encode(value, encoding);
      length = Packet.lengthCodedNumberLength(value.length) + value.length;
    }
  }
  return {
    value,
    type,
    length,
    byteLength,
    writer,
    unsigned: false,
    isNull: type === Types.NULL,
  };
}

function writeNothing() {}

module.exports = { toParameter, isJSON };

'use strict';

const { isAnyArrayBuffer } = require('util').types;
const Types = require('../constants/types');
const Packet = require('../packets/packet');
const StringParser = require('../parsers/string.js');
const {
  TypedParameter,
  asBuffer,
  encodeTypedParameter,
  integerHint,
} = require('./typed_parameter.js');
const FieldFlags = require('../constants/field_flags.js');

function isJSON(value) {
  if (Array.isArray(value) || value.constructor === Object) {
    return true;
  }
  const prototype = Object.getPrototypeOf(value);
  return (
    prototype === null ||
    prototype === Object.prototype ||
    (typeof value.toJSON === 'function' && !Buffer.isBuffer(value))
  );
}

function constructorName(value) {
  const prototype = Object.getPrototypeOf(value);
  const constructor =
    prototype && Object.getOwnPropertyDescriptor(prototype, 'constructor');
  const name =
    constructor && typeof constructor.value === 'function'
      ? Object.getOwnPropertyDescriptor(constructor.value, 'name')
      : undefined;
  return name && typeof name.value === 'string' && name.value !== ''
    ? name.value
    : 'object';
}

function unsupportedParameter(received) {
  return new TypeError(
    `Bind parameters must be null, a number, boolean, bigint, string, Date, Buffer, ArrayBuffer, TypedArray, DataView, plain object, array, or an object with toJSON(); received ${received}`
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
        } else if (ArrayBuffer.isView(value)) {
          // send buffers as BLOB so servers treat the value as binary data
          // rather than a string in the connection charset (MariaDB converts
          // string parameters when storing into binary columns such as
          // VECTOR, corrupting the value)
          value = asBuffer(value);
          type = Types.BLOB;
          length = Packet.lengthCodedNumberLength(value.length) + value.length;
          writer = Packet.prototype.writeLengthCodedBuffer;
        } else if (isAnyArrayBuffer(value)) {
          value = Buffer.from(value);
          length = Packet.lengthCodedNumberLength(value.length) + value.length;
          writer = Packet.prototype.writeLengthCodedBuffer;
        } else {
          throw unsupportedParameter(constructorName(value));
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
    if (typeof value !== 'string') {
      throw unsupportedParameter(`a value that converts to ${typeof value}`);
    }
    if (
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

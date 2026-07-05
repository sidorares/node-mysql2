'use strict';

const Types = require('../constants/types');
const Packet = require('../packets/packet');

function isJSON(value) {
  return (
    Array.isArray(value) ||
    value.constructor === Object ||
    (typeof value.toJSON === 'function' && !Buffer.isBuffer(value))
  );
}

function toParameter(value, encoding, timezone, jsonAsString) {
  let type = Types.VAR_STRING;
  let length;
  let writer = function (value) {
    // eslint-disable-next-line no-invalid-this
    return Packet.prototype.writeLengthCodedString.call(this, value, encoding);
  };
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
            // eslint-disable-next-line no-invalid-this
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
  }
  if (!length) {
    length = Packet.lengthCodedStringLength(value, encoding);
  }
  return { value, type, length, writer };
}

module.exports = { toParameter, isJSON };

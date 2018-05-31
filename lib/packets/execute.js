var CursorType = require('../constants/cursor');
var CommandCodes = require('../constants/commands');
var Types = require('../constants/types');
var Packet = require('../packets/packet');
var CharsetToEncoding = require('../constants/charset_encodings.js');

function Execute(id, parameters, charsetNumber) {
  this.id = id;
  this.parameters = parameters;
  this.encoding = CharsetToEncoding[charsetNumber];
}

function isJSON(value) {
  return Array.isArray(value) ||
    value.constructor === Object ||
    (typeof value.toJSON === 'function' && !Buffer.isBuffer(value));
}

/**
 * Converts a value to an object describing type, String/Buffer representation and length
 * @param {*} value
 */
function toParameter(value, encoding) {
  var type = Types.VAR_STRING;
  var length;
  var writer = function (value) {
    return Packet.prototype.writeLengthCodedString.call(this, value, encoding)
  }
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
        if (Object.prototype.toString.call(value) == '[object Date]') {
          type = Types.DATETIME;
          length = 12;
          writer = Packet.prototype.writeDate
        } else if (isJSON(value)) {
          value = JSON.stringify(value);
          type = Types.JSON;
        } else if (Buffer.isBuffer(value)) {
          length = Packet.lengthCodedNumberLength(value.length) + value.length;
          writer = Packet.prototype.writeLengthCodedBuffer
        }
        break;

      default:
        value = value.toString();
    }
  } else {
    value = ''
    type = Types.NULL;
  }
  if (!length) {
    length = Packet.lengthCodedStringLength(value, encoding);
  }
  return { value, type, length, writer };
}

Execute.prototype.toPacket = function() {
  var self = this;

  // TODO: don't try to calculate packet length in advance, allocate some big buffer in advance (header + 256 bytes?)
  // and copy + reallocate if not enough

  var i;
  // 0 + 4 - length, seqId
  // 4 + 1 - COM_EXECUTE
  // 5 + 4 - stmtId
  // 9 + 1 - flags
  // 10 + 4 - iteration-count (always 1)
  var length = 14;
  var parameters;
  if (this.parameters && this.parameters.length > 0) {
    length += Math.floor((this.parameters.length + 7) / 8);
    length += 1; // new-params-bound-flag
    length += 2 * this.parameters.length; // type byte for each parameter if new-params-bound-flag is set
    parameters = this.parameters.map(function (value) {
      return toParameter(value, self.encoding);
    });
    length += parameters.reduce(function (accumulator, parameter) {
      return accumulator + parameter.length;
    }, 0);
  }

  var buffer = Buffer.allocUnsafe(length);
  var packet = new Packet(0, buffer, 0, length);
  packet.offset = 4;
  packet.writeInt8(CommandCodes.STMT_EXECUTE);
  packet.writeInt32(this.id);
  packet.writeInt8(CursorType.NO_CURSOR); // flags
  packet.writeInt32(1); // iteration-count, always 1
  if (parameters) {
    var bitmap = 0;
    var bitValue = 1;
    parameters.forEach(function (parameter) {
      if (parameter.type === Types.NULL) {
        bitmap += bitValue;
      }
      bitValue *= 2;
      if (bitValue == 256) {
        packet.writeInt8(bitmap);
        bitmap = 0;
        bitValue = 1;
      }
    });
    if (bitValue != 1) {
      packet.writeInt8(bitmap);
    }

    // TODO: explain meaning of the flag
    // afaik, if set n*2 bytes with type of parameter are sent before parameters
    // if not, previous execution types are used (TODO prooflink)
    packet.writeInt8(1); // new-params-bound-flag

    // Write parameter types
    parameters.forEach(function (parameter) {
      packet.writeInt8(parameter.type); // field type
      packet.writeInt8(0); // parameter flag
    });

    // Write parameter values
    parameters.forEach(function (parameter) {
    if (parameter.type !== Types.NULL) {
        parameter.writer.call(packet, parameter.value)
      }
    });
  }
  return packet;
};

module.exports = Execute;

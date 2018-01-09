var Buffer = require('safe-buffer').Buffer;
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

var pad = '000000000000';
function leftPad(num, value) {
    var s = value.toString();
    // if we don't need to pad
    if (s.length >= num) {
        return s;
    }
    return (pad + s).slice(-num);
}

function toMysqlDateTime(date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-') +  ' ' +
    [date.getHours(), date.getMinutes(), date.getSeconds()].join(':') + '.' +
    leftPad(3, date.getMilliseconds());
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
  var fixed = false;
  if (value !== null) {
    switch (typeof value) {
      case 'number':
        type = Types.DOUBLE;
        fixed = true;
        var bufferValue = Buffer.allocUnsafe(8);
        bufferValue.writeDoubleLE(value, 0);
        value = bufferValue;
        break;

      case 'boolean':
        type = Types.TINY;
        fixed = true;
        var bufferValue = Buffer.allocUnsafe(1);
        bufferValue.writeInt8(value | 0, 0);
        value = bufferValue;
        break;

      case 'object':
        if (Object.prototype.toString.call(value) == '[object Date]') {
          value = toMysqlDateTime(value);
        } else if (isJSON(value)) {
          type = Types.JSON;
          value = JSON.stringify(value);
        }
        break;
    }
  } else {
    type = Types.NULL;
    value = '';
  }
  if (fixed) {
    length = value.length;
  } else {
    if (Buffer.isBuffer(value)) {
      length = Packet.lengthCodedNumberLength(value.length) + value.length;
    } else {
      value = value.toString();
      length = Packet.lengthCodedStringLength(value, encoding);
    }
  }
  return { type, value, length, fixed };
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
        if (parameter.fixed) {
          packet.writeBuffer(parameter.value);
        } else if (Buffer.isBuffer(parameter.value)) {
          packet.writeLengthCodedBuffer(parameter.value);
        } else {
          packet.writeLengthCodedString(parameter.value, self.encoding);
        }
      }
    });
  }
  return packet;
};

module.exports = Execute;

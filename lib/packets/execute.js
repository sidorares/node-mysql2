'use strict';

const CursorType = require('../constants/cursor');
const CommandCodes = require('../constants/commands');
const FieldFlags = require('../constants/field_flags.js');
const Types = require('../constants/types');
const Packet = require('../packets/packet');
const CharsetToEncoding = require('../constants/charset_encodings.js');

function isJSON(value) {
  return (
    Array.isArray(value) ||
    value.constructor === Object ||
    (typeof value.toJSON === 'function' && !Buffer.isBuffer(value))
  );
}

/**
 * Converts a value to an object describing type, String/Buffer representation and length
 * @param {*} value
 */
function toParameter(value, encoding, timezone, parameterHints) {
  let type = parameterHints.columnType;
  let length;
  let writer = function(value) {
    // eslint-disable-next-line no-invalid-this
    return Packet.prototype.writeLengthCodedString.call(this, value, encoding);
  };
  const unsigned = parameterHints.flags & FieldFlags.UNSIGNED;

  if (value !== null) {
    if (typeof value === 'undefined') {
      throw new TypeError('Bind parameters must not contain undefined');
    }

    // currently exception for Date and plain object input parameters - even if statement expects another type we'll still send date/stringified json
    // this might change in the future
    if (Object.prototype.toString.call(value) === '[object Date]') {
      type = Types.DATETIME;
      length = 12;
      writer = function(value) {
        // eslint-disable-next-line no-invalid-this
        return Packet.prototype.writeDate.call(this, value, timezone);
      };
      return { value, type, length, writer };
    } else if (isJSON(value)) {
      value = JSON.stringify(value);
      type = Types.JSON;
      length = Packet.lengthCodedStringLength(value, encoding);
      return { value, type, length, writer };
    } else if (Buffer.isBuffer(value)) {
      length = Packet.lengthCodedNumberLength(value.length) + value.length;
      writer = Packet.prototype.writeLengthCodedBuffer;
      type = Types.VAR_STRING;
      return { value, type, length, writer };
    }

    switch(parameterHints.columnType) {
      case Types.TINY:
        value = value | 0;
        length = 1;
        writer = unsigned ? Packet.prototype.writeInt8 : Packet.prototype.writeUInt8;
        break;
      case Types.YEAR:
      case Types.SHORT:
        value = value | 0;
        length = 2;
        writer = unsigned ?  Packet.prototype.writeInt16 : Packet.prototype.writeSInt16;
        break;
      case Types.LONG:
      case Types.INT24: // in binary protocol int24 is encoded in 4 bytes int32
        value = value | 0;
        length = 4;
        writer = unsigned ? Packet.prototype.writeInt32() : Packet.prototype.writeSInt32();
        break;
      case Types.DATETIME:
        if (!(Object.prototype.toString.call(value) === '[object Date]')) {
          length = 12;
          writer = function(value) {
            // eslint-disable-next-line no-invalid-this
            return Packet.prototype.writeDate.call(this, value, timezone);
          };
        } else {
          // if parameter is not a date serialize it as string by default
          value = value.toString();
          type = Types.VAR_STRING;
        }
        break;
      case Types.FLOAT:
        length = 4;
        writer = Packet.prototype.writeFloat;
        break;
      case Types.DOUBLE:
        length = 8;
        writer = Packet.prototype.writeDouble;
        break;
      case Types.JSON:
        value = JSON.stringify(value);
        type = parameterHints.type;
        break;
      case Types.LONGLONG:
        // this should also cover anything that serializes to a string ( BigInt etc )
        type = Types.VAR_STRING;
        value = value.toString();
        break;  
      default:
        type = Types.VAR_STRING;
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

class Execute {
  constructor(statement, parameters, charsetNumber, timezone) {
    this.statement = statement;
    this.parameters = parameters;
    this.encoding = CharsetToEncoding[charsetNumber];
    this.timezone = timezone;
  }

  toPacket() {

    if ((this.statement.parameters.length > 0 && !this.parameters) || (this.parameters && this.parameters.length !== this.statement.parameters.length)) {
      throw new TypeError(`Incorrect number of bind parameters, expected ${this.statement.parameters.length} but supplied ${this.parameters.length}`);
    }

    // TODO: don't try to calculate packet length in advance, allocate some big buffer in advance (header + 256 bytes?)
    // and copy + reallocate if not enough
    // 0 + 4 - length, seqId
    // 4 + 1 - COM_EXECUTE
    // 5 + 4 - stmtId
    // 9 + 1 - flags
    // 10 + 4 - iteration-count (always 1)
    let length = 14;
    let parameters;
    if (this.parameters && this.parameters.length > 0) {
      length += Math.floor((this.parameters.length + 7) / 8);
      length += 1; // new-params-bound-flag
      length += 2 * this.parameters.length; // type byte for each parameter if new-params-bound-flag is set
      parameters = this.parameters.map((value, index) =>
        toParameter(value, this.encoding, this.timezone, this.statement.parameters[index])
      );
      length += parameters.reduce(
        (accumulator, parameter) => accumulator + parameter.length,
        0
      );
    }
    const buffer = Buffer.allocUnsafe(length);
    const packet = new Packet(0, buffer, 0, length);
    packet.offset = 4;
    packet.writeInt8(CommandCodes.STMT_EXECUTE);
    packet.writeInt32(this.statement.id);
    packet.writeInt8(CursorType.NO_CURSOR); // flags
    packet.writeInt32(1); // iteration-count, always 1
    if (parameters) {
      let bitmap = 0;
      let bitValue = 1;
      parameters.forEach(parameter => {
        if (parameter.type === Types.NULL) {
          bitmap += bitValue;
        }
        bitValue *= 2;
        if (bitValue === 256) {
          packet.writeInt8(bitmap);
          bitmap = 0;
          bitValue = 1;
        }
      });
      if (bitValue !== 1) {
        packet.writeInt8(bitmap);
      }
      // TODO: explain meaning of the flag
      // afaik, if set n*2 bytes with type of parameter are sent before parameters
      // if not, previous execution types are used (TODO prooflink)
      packet.writeInt8(1); // new-params-bound-flag
      // Write parameter types
      parameters.forEach(parameter => {
        packet.writeInt8(parameter.type); // field type
        packet.writeInt8(0); // parameter flag
      });
      // Write parameter values
      parameters.forEach(parameter => {
        if (parameter.type !== Types.NULL) {
          parameter.writer.call(packet, parameter.value);
        }
      });
    }
    return packet;
  }
}

module.exports = Execute;

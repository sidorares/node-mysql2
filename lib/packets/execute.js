'use strict';

const CursorType = require('../constants/cursor');
const CommandCodes = require('../constants/commands');
const ClientConstants = require('../constants/client');
const Types = require('../constants/types');
const Packet = require('../packets/packet');
const CharsetToEncoding = require('../constants/charset_encodings.js');
const { toParameter } = require('./encode_parameter.js');

class Execute {
  constructor(
    id,
    parameters,
    charsetNumber,
    timezone,
    attributes,
    clientFlags
  ) {
    this.id = id;
    this.parameters = parameters;
    this.encoding = CharsetToEncoding[charsetNumber];
    this.timezone = timezone;
    this.attributes = attributes;
    this.clientFlags = clientFlags || 0;
  }

  static fromPacket(packet, encoding) {
    const stmtId = packet.readInt32();
    const flags = packet.readInt8();
    const iterationCount = packet.readInt32();

    let i = packet.offset;
    while (i < packet.end - 1) {
      if (
        (packet.buffer[i + 1] === Types.VAR_STRING ||
          packet.buffer[i + 1] === Types.NULL ||
          packet.buffer[i + 1] === Types.DOUBLE ||
          packet.buffer[i + 1] === Types.TINY ||
          packet.buffer[i + 1] === Types.DATETIME ||
          packet.buffer[i + 1] === Types.JSON) &&
        packet.buffer[i] === 1 &&
        packet.buffer[i + 2] === 0
      ) {
        break;
      } else {
        packet.readInt8();
      }
      i++;
    }

    const types = [];

    for (let i = packet.offset + 1; i < packet.end - 1; i++) {
      if (
        (packet.buffer[i] === Types.VAR_STRING ||
          packet.buffer[i] === Types.NULL ||
          packet.buffer[i] === Types.DOUBLE ||
          packet.buffer[i] === Types.TINY ||
          packet.buffer[i] === Types.DATETIME ||
          packet.buffer[i] === Types.JSON) &&
        packet.buffer[i + 1] === 0
      ) {
        types.push(packet.buffer[i]);
        packet.skip(2);
      }
    }

    packet.skip(1);

    const values = [];
    for (let i = 0; i < types.length; i++) {
      if (types[i] === Types.VAR_STRING) {
        values.push(packet.readLengthCodedString(encoding));
      } else if (types[i] === Types.DOUBLE) {
        values.push(packet.readDouble());
      } else if (types[i] === Types.TINY) {
        values.push(packet.readInt8());
      } else if (types[i] === Types.DATETIME) {
        values.push(packet.readDateTime());
      } else if (types[i] === Types.JSON) {
        values.push(JSON.parse(packet.readLengthCodedString(encoding)));
      }
      if (types[i] === Types.NULL) {
        values.push(null);
      }
    }

    return { stmtId, flags, iterationCount, values };
  }

  _serializeToBuffer(buffer) {
    const useQueryAttributes =
      this.clientFlags & ClientConstants.CLIENT_QUERY_ATTRIBUTES;

    const attrNames =
      useQueryAttributes && this.attributes ? Object.keys(this.attributes) : [];
    const numParams = this.parameters ? this.parameters.length : 0;
    const numAttrs = attrNames.length;
    const totalParams = numParams + numAttrs;

    const packet = new Packet(0, buffer, 0, buffer.length);
    packet.offset = 4;
    packet.writeInt8(CommandCodes.STMT_EXECUTE);
    packet.writeInt32(this.id);

    let cursorFlags = CursorType.NO_CURSOR;
    if (useQueryAttributes) {
      cursorFlags |= CursorType.PARAMETER_COUNT_AVAILABLE;
    }
    packet.writeInt8(cursorFlags);
    packet.writeInt32(1); // iteration-count, always 1

    if (useQueryAttributes) {
      packet.writeLengthCodedNumber(totalParams);
    }

    if (totalParams > 0) {
      const bindParams =
        numParams > 0
          ? this.parameters.map((v) =>
              toParameter(v, this.encoding, this.timezone)
            )
          : [];
      const attrParams = attrNames.map((name) =>
        toParameter(this.attributes[name], this.encoding, this.timezone)
      );
      const allParams = bindParams.concat(attrParams);

      // null bitmap
      let bitmap = 0;
      let bitValue = 1;
      allParams.forEach((parameter) => {
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

      packet.writeInt8(1); // new-params-bound-flag

      // types (and names for attributes)
      for (let i = 0; i < allParams.length; i++) {
        packet.writeInt8(allParams[i].type);
        packet.writeInt8(0); // unsigned flag
        if (useQueryAttributes) {
          const name = i < numParams ? '' : attrNames[i - numParams];
          packet.writeLengthCodedString(name, this.encoding);
        }
      }

      // values
      allParams.forEach((parameter) => {
        if (parameter.type !== Types.NULL) {
          parameter.writer.call(packet, parameter.value);
        }
      });
    }

    return packet;
  }

  toPacket() {
    const p = this._serializeToBuffer(Packet.MockBuffer());
    return this._serializeToBuffer(Buffer.allocUnsafe(p.offset));
  }
}

module.exports = Execute;

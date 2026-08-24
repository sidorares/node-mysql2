'use strict';

const CursorType = require('../constants/cursor');
const CommandCodes = require('../constants/commands');
const ClientConstants = require('../constants/client');
const Types = require('../constants/types');
const Packet = require('../packets/packet');
const StringParser = require('../parsers/string.js');
const CharsetToEncoding = require('../constants/charset_encodings.js');
const { toParameter } = require('./encode_parameter.js');

class Execute {
  constructor(
    id,
    parameters,
    charsetNumber,
    timezone,
    attributes,
    clientFlags,
    jsonAsString,
    parameterDefinitions
  ) {
    this.id = id;
    this.parameters = parameters;
    this.encoding = CharsetToEncoding[charsetNumber];
    this.timezone = timezone;
    this.attributes = attributes;
    this.clientFlags = clientFlags || 0;
    this.jsonAsString = jsonAsString || false;
    this.parameterDefinitions = parameterDefinitions || [];
  }

  static fromPacket(packet, encoding) {
    const stmtId = packet.readInt32();
    const flags = packet.readInt8();
    const iterationCount = packet.readInt32();

    let i = packet.offset;
    while (i < packet.end - 1) {
      if (
        (packet.buffer[i + 1] === Types.VAR_STRING ||
          packet.buffer[i + 1] === Types.BLOB ||
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
          packet.buffer[i] === Types.BLOB ||
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
      } else if (types[i] === Types.BLOB) {
        values.push(packet.readLengthCodedBuffer());
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

  toPacket() {
    const useQueryAttributes =
      this.clientFlags & ClientConstants.CLIENT_QUERY_ATTRIBUTES;

    const attrNames =
      useQueryAttributes && this.attributes ? Object.keys(this.attributes) : [];
    const numParams = this.parameters ? this.parameters.length : 0;
    const numAttrs = attrNames.length;
    const totalParams = numParams + numAttrs;

    // packet header, command, statement id, cursor flags, iteration count
    let length = 14;
    if (useQueryAttributes) {
      length += Packet.lengthCodedNumberLength(totalParams);
    }

    let allParams = null;
    let attrNameBuffers = null;
    if (totalParams > 0) {
      allParams = new Array(totalParams);
      for (let i = 0; i < numParams; i++) {
        allParams[i] = toParameter(
          this.parameters[i],
          this.encoding,
          this.timezone,
          this.jsonAsString,
          this.parameterDefinitions[i]
        );
      }
      for (let i = 0; i < numAttrs; i++) {
        allParams[numParams + i] = toParameter(
          this.attributes[attrNames[i]],
          this.encoding,
          this.timezone
        );
      }

      // null bitmap, new-params-bound flag, type and unsigned byte per parameter
      length += ((totalParams + 7) >> 3) + 1 + totalParams * 2;
      if (useQueryAttributes) {
        // one empty length-coded name per bind parameter
        length += numParams;
        attrNameBuffers = new Array(numAttrs);
        for (let i = 0; i < numAttrs; i++) {
          const name = StringParser.encode(attrNames[i], this.encoding);
          attrNameBuffers[i] = name;
          length += Packet.lengthCodedNumberLength(name.length) + name.length;
        }
      }
      for (let i = 0; i < totalParams; i++) {
        if (!allParams[i].isNull) {
          length += allParams[i].length;
        }
      }
    }

    const packet = new Packet(0, Buffer.allocUnsafe(length), 0, length);
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
      let bitmap = 0;
      let bitValue = 1;
      for (let i = 0; i < totalParams; i++) {
        if (allParams[i].isNull) {
          bitmap |= bitValue;
        }
        bitValue *= 2;
        if (bitValue === 256) {
          packet.writeInt8(bitmap);
          bitmap = 0;
          bitValue = 1;
        }
      }
      if (bitValue !== 1) {
        packet.writeInt8(bitmap);
      }

      packet.writeInt8(1); // new-params-bound-flag

      for (let i = 0; i < totalParams; i++) {
        const parameter = allParams[i];
        packet.writeInt8(parameter.type);
        packet.writeInt8(parameter.unsigned ? 0x80 : 0);
        if (useQueryAttributes) {
          if (i < numParams) {
            packet.writeInt8(0); // bind parameters have an empty name
          } else {
            packet.writeLengthCodedBuffer(attrNameBuffers[i - numParams]);
          }
        }
      }

      for (let i = 0; i < totalParams; i++) {
        const parameter = allParams[i];
        if (!parameter.isNull) {
          parameter.writer.call(packet, parameter.value, parameter.byteLength);
        }
      }
    }

    if (packet.offset !== length) {
      throw new Error(
        `Internal error: COM_STMT_EXECUTE serialized ${packet.offset - 4} bytes, expected ${length - 4}`
      );
    }
    return packet;
  }
}

module.exports = Execute;

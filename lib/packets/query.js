'use strict';

const Packet = require('../packets/packet.js');
const CommandCode = require('../constants/commands.js');
const StringParser = require('../parsers/string.js');
const CharsetToEncoding = require('../constants/charset_encodings.js');
const ClientConstants = require('../constants/client.js');
const { toParameter } = require('./encode_parameter.js');

class Query {
  constructor(sql, charsetNumber, attributes, clientFlags) {
    this.query = sql;
    this.charsetNumber = charsetNumber;
    this.encoding = CharsetToEncoding[charsetNumber];
    this.attributes = attributes;
    this.clientFlags = clientFlags || 0;
  }

  toPacket() {
    const useQueryAttributes =
      this.clientFlags & ClientConstants.CLIENT_QUERY_ATTRIBUTES;
    const attributeCount =
      useQueryAttributes && this.attributes
        ? Object.keys(this.attributes).length
        : 0;

    if (attributeCount === 0) {
      // fast path: no attribute values to serialize, so the packet length is
      // known upfront and the SQL can be encoded straight into the buffer
      const headerLength = useQueryAttributes ? 7 : 5;
      if (Buffer.isEncoding(this.encoding)) {
        const sqlLength = Buffer.byteLength(this.query, this.encoding);
        const length = headerLength + sqlLength;
        const buffer = Buffer.allocUnsafe(length);
        const packet = new Packet(0, buffer, 0, length);
        packet.offset = 4;
        packet.writeInt8(CommandCode.QUERY);
        if (useQueryAttributes) {
          packet.writeInt8(0); // parameter_count
          packet.writeInt8(1); // parameter_set_count, always 1
        }
        buffer.write(this.query, packet.offset, this.encoding);
        packet.offset = length;
        return packet;
      }
      const buf = StringParser.encode(this.query, this.encoding);
      const length = headerLength + buf.length;
      const buffer = Buffer.allocUnsafe(length);
      const packet = new Packet(0, buffer, 0, length);
      packet.offset = 4;
      packet.writeInt8(CommandCode.QUERY);
      if (useQueryAttributes) {
        packet.writeInt8(0); // parameter_count
        packet.writeInt8(1); // parameter_set_count, always 1
      }
      packet.writeBuffer(buf);
      return packet;
    }

    const names = Object.keys(this.attributes);
    const parameters = new Array(attributeCount);
    const nameBuffers = new Array(attributeCount);

    // packet header, command, parameter count, parameter_set_count (always
    // the single-byte form), null bitmap, new_params_bind_flag, type and
    // unsigned byte per parameter
    let length =
      5 +
      Packet.lengthCodedNumberLength(attributeCount) +
      1 +
      ((attributeCount + 7) >> 3) +
      1 +
      attributeCount * 2;
    for (let i = 0; i < attributeCount; i++) {
      parameters[i] = toParameter(
        this.attributes[names[i]],
        this.encoding,
        'local'
      );
      const name = StringParser.encode(names[i], this.encoding);
      nameBuffers[i] = name;
      length += Packet.lengthCodedNumberLength(name.length) + name.length;
      if (!parameters[i].isNull) {
        length += parameters[i].length;
      }
    }
    const sqlBuffer = StringParser.encode(this.query, this.encoding);
    length += sqlBuffer.length;

    const packet = new Packet(0, Buffer.allocUnsafe(length), 0, length);
    packet.offset = 4;
    packet.writeInt8(CommandCode.QUERY);
    packet.writeLengthCodedNumber(attributeCount);
    packet.writeLengthCodedNumber(1); // parameter_set_count, always 1

    let bitmap = 0;
    let bitValue = 1;
    for (let i = 0; i < attributeCount; i++) {
      if (parameters[i].isNull) {
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

    packet.writeInt8(1); // new_params_bind_flag

    for (let i = 0; i < attributeCount; i++) {
      packet.writeInt8(parameters[i].type);
      packet.writeInt8(parameters[i].unsigned ? 0x80 : 0);
      packet.writeLengthCodedBuffer(nameBuffers[i]);
    }

    for (let i = 0; i < attributeCount; i++) {
      if (!parameters[i].isNull) {
        parameters[i].writer.call(packet, parameters[i].value);
      }
    }

    packet.writeBuffer(sqlBuffer);

    if (packet.offset !== length) {
      throw new Error(
        `Internal error: COM_QUERY serialized ${packet.offset - 4} bytes, expected ${length - 4}`
      );
    }
    return packet;
  }
}

module.exports = Query;

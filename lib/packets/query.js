'use strict';

const Packet = require('../packets/packet.js');
const CommandCode = require('../constants/commands.js');
const StringParser = require('../parsers/string.js');
const CharsetToEncoding = require('../constants/charset_encodings.js');
const ClientConstants = require('../constants/client.js');
const Types = require('../constants/types.js');
const { toParameter } = require('./encode_parameter.js');

class Query {
  constructor(sql, charsetNumber, attributes, clientFlags) {
    this.query = sql;
    this.charsetNumber = charsetNumber;
    this.encoding = CharsetToEncoding[charsetNumber];
    this.attributes = attributes;
    this.clientFlags = clientFlags || 0;
  }

  serializeToBuffer(buffer) {
    const useQueryAttributes =
      this.clientFlags & ClientConstants.CLIENT_QUERY_ATTRIBUTES;
    const sqlBuf = StringParser.encode(this.query, this.encoding);
    const packet = new Packet(0, buffer, 0, buffer.length);
    packet.offset = 4;
    packet.writeInt8(CommandCode.QUERY);

    if (useQueryAttributes) {
      const attrs = this.attributes;
      const names = attrs ? Object.keys(attrs) : [];
      const paramCount = names.length;

      packet.writeLengthCodedNumber(paramCount);
      packet.writeLengthCodedNumber(1); // parameter_set_count, always 1

      if (paramCount > 0) {
        const parameters = names.map((name) =>
          toParameter(attrs[name], this.encoding, 'local')
        );

        // null bitmap
        let bitmap = 0;
        let bitValue = 1;
        parameters.forEach((parameter) => {
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

        packet.writeInt8(1); // new_params_bind_flag

        // types and names
        for (let i = 0; i < paramCount; i++) {
          packet.writeInt8(parameters[i].type);
          packet.writeInt8(0); // unsigned flag
          packet.writeLengthCodedString(names[i], this.encoding);
        }

        // values
        parameters.forEach((parameter) => {
          if (parameter.type !== Types.NULL) {
            parameter.writer.call(packet, parameter.value);
          }
        });
      }
    }

    packet.writeBuffer(sqlBuf);
    return packet;
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

    // dry run to calculate required buffer length
    const p = this.serializeToBuffer(Packet.MockBuffer());
    return this.serializeToBuffer(Buffer.allocUnsafe(p.offset));
  }
}

module.exports = Query;

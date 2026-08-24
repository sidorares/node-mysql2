'use strict';

const Packet = require('../packets/packet');
const CommandCodes = require('../constants/commands');
const StringParser = require('../parsers/string.js');
const CharsetToEncoding = require('../constants/charset_encodings.js');

class PrepareStatement {
  constructor(sql, charsetNumber) {
    this.query = sql;
    this.charsetNumber = charsetNumber;
    this.encoding = CharsetToEncoding[charsetNumber];
  }

  toPacket() {
    if (
      StringParser.hasFastUtf8Write &&
      (this.encoding === 'utf8' || this.encoding === 'utf-8')
    ) {
      const length = 5 + Buffer.byteLength(this.query, 'utf8');
      const buffer = Buffer.allocUnsafe(length);
      buffer[4] = CommandCodes.STMT_PREPARE;
      buffer.utf8Write(this.query, 5, length - 5);
      const packet = new Packet(0, buffer, 0, length);
      packet.offset = length;
      return packet;
    }
    const buf = StringParser.encode(this.query, this.encoding);
    const length = 5 + buf.length;
    const buffer = Buffer.allocUnsafe(length);
    const packet = new Packet(0, buffer, 0, length);
    packet.offset = 4;
    packet.writeInt8(CommandCodes.STMT_PREPARE);
    packet.writeBuffer(buf);
    return packet;
  }
}

module.exports = PrepareStatement;

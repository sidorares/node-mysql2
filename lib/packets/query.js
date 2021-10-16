'use strict';

const Packet = require('../packets/packet.js');
const CommandCode = require('../constants/commands.js');
const StringParser = require('../parsers/string.js');
class Query {
  constructor(sql, encoding) {
    this.query = sql;
    this.encoding = encoding;
  }

  toPacket() {
    const buf = StringParser.encode(this.query, this.encoding);
    const length = 5 + buf.length;
    const buffer = Buffer.allocUnsafe(length);
    const packet = new Packet(0, buffer, 0, length);
    packet.offset = 4;
    packet.writeInt8(CommandCode.QUERY);
    packet.writeBuffer(buf);
    return packet;
  }
}

module.exports = Query;

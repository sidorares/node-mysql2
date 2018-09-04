const Packet = require('../packets/packet.js');
const CommandCode = require('../constants/commands.js');
const StringParser = require('../parsers/string.js');
const CharsetToEncoding = require('../constants/charset_encodings.js');

class Query {
  constructor(sql, charsetNumber) {
    this.query = sql;
    this.charsetNumber = charsetNumber;
    this.encoding = CharsetToEncoding[charsetNumber];
  }
  
  toPacket() {
    var buf = StringParser.encode(this.query, this.encoding);
    var length = 5 + buf.length;
    var buffer = Buffer.allocUnsafe(length);
    var packet = new Packet(0, buffer, 0, length);
    packet.offset = 4;
    packet.writeInt8(CommandCode.QUERY);
    packet.writeBuffer(buf);
    return packet;
  }
}


module.exports = Query;

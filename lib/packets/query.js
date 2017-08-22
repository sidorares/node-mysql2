var Buffer = require('safe-buffer').Buffer;
var Packet = require('../packets/packet.js');
var CommandCode = require('../constants/commands.js');
var StringParser = require('../parsers/string.js');
var CharsetToEncoding = require('../constants/charset_encodings.js');

function Query(sql, charsetNumber) {
  this.query = sql;
  this.charsetNumber = charsetNumber;
  this.encoding = CharsetToEncoding[charsetNumber];
}

Query.prototype.toPacket = function() {
  var buf = StringParser.encode(this.query, this.encoding);
  var length = 5 + buf.length;

  var buffer = Buffer.allocUnsafe(length);
  var packet = new Packet(0, buffer, 0, length);
  packet.offset = 4;
  packet.writeInt8(CommandCode.QUERY);
  packet.writeBuffer(buf);
  return packet;
};

module.exports = Query;

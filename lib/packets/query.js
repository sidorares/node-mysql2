var Buffer = require('safe-buffer').Buffer;
var Packet = require('../packets/packet.js');
var CommandCode = require('../constants/commands.js');
var StringParser = require('../parsers/string.js');

function Query (sql, charsetNumber)
{
  this.query = sql;
  this.charsetNumber = charsetNumber;
}

Query.prototype.toPacket = function ()
{
  var buf = StringParser.encode(this.query, 'cesu8');
  var length = 5 + buf.length;
  var buffer = Buffer.allocUnsafe(length);
  var packet = new Packet(0, buffer, 0, length);
  packet.offset = 4;
  packet.writeInt8(CommandCode.QUERY);
  packet.writeString(this.query);
  return packet;
};

module.exports = Query;

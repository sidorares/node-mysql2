var Buffer = require('safe-buffer').Buffer;
var Packet = require('../packets/packet');
var CommandCodes = require('../constants/commands');
var StringParser = require('../parsers/string.js');

function PrepareStatement (sql)
{
  this.query = sql;
}

PrepareStatement.prototype.toPacket = function ()
{
  var buf = StringParser.encode(this.query, 'cesu8');
  var length = 5 + buf.length;
  var buffer = Buffer.allocUnsafe(length);
  var packet = new Packet(0, buffer, 0, length);
  packet.offset = 4;
  packet.writeInt8(CommandCodes.STMT_PREPARE);
  packet.writeString(this.query);
  return packet;
};

module.exports = PrepareStatement;

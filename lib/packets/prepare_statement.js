var Packet = require('../packets/packet');
var CommandCodes = require('../constants/commands');

function PrepareStatement(sql)
{
  this.query = sql;
}

PrepareStatement.prototype.toPacket = function()
{
  var length = 5 + Buffer.byteLength(this.query, 'utf8');
  var buffer = new Buffer(length);
  var packet = new Packet(0, buffer, 0, length);
  packet.offset = 4;
  packet.writeInt8(CommandCodes.STMT_PREPARE);
  packet.writeString(this.query);
  return packet;
};

module.exports = PrepareStatement;

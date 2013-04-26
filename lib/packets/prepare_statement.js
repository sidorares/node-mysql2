var Packet = require('../packets/packet');

function PrepareStatement(sql)
{
  this.query = sql;
}

PrepareStatement.prototype.toPacket = function()
{
  var length = 5 + this.query.length;
  var buffer = new Buffer(length);
  var packet = new Packet(0, buffer);
  packet.offset = 4;
  packet.writeInt8(0x16); // TODO: constants.COM_PREPARE
  packet.writeString(this.query);
  return packet;
};

module.exports = PrepareStatement;

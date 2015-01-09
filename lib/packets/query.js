var Packet      = require('../packets/packet.js');
var CommandCode = require('../constants/commands.js');

function Query(sql)
{
  this.query = sql;
}

Query.prototype.toPacket = function()
{
  var length = 5 + Buffer.byteLength(this.query, 'utf8');
  var buffer = new Buffer(length);
  var packet = new Packet(0, buffer, 0, length);
  packet.offset = 4;
  packet.writeInt8(CommandCode.QUERY);
  packet.writeString(this.query);
  return packet;
};

module.exports = Query;

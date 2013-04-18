//var constants = require('../constants');
var Packet = require('../packets/packet');

function Query(sql)
{
  this.query = sql;
}

Query.prototype.toPacket = function()
{
  var length = 5 + Buffer.byteLength(this.query, 'utf8');
  var buffer = new Buffer(length);
  var packet = new Packet(0, buffer);
  packet.offset = 4;
  packet.writeInt8(3); // TODO: constants.COM_QUERY
  packet.writeString(this.query);
  return packet;
};

module.exports = Query;

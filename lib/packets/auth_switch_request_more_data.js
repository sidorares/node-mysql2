// http://dev.mysql.com/doc/internals/en/connection-phase-packets.html#packet-Protocol::AuthSwitchRequest
var Buffer = require('safe-buffer').Buffer;
var Packet = require('../packets/packet');

function AuthSwitchRequestMoreData (data)
{
  this.data = data;
}

AuthSwitchRequestMoreData.prototype.toPacket = function ()
{
  var length = 5 + this.data.length;
  var buffer = Buffer.allocUnsafe(length);
  var packet = new Packet(0, buffer, 0, length);
  packet.offset = 4;
  packet.writeInt8(0x01);
  packet.writeBuffer(this.data);
  return packet;
};

AuthSwitchRequestMoreData.fromPacket = function (packet)
{
  var marker = packet.readInt8();
  var data = packet.readBuffer();
  return new AuthSwitchRequestMoreData(data);
};

AuthSwitchRequestMoreData.verifyMarker = function (packet) {
  return (packet.peekByte() == 0x01);
};

module.exports = AuthSwitchRequestMoreData;

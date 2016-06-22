// http://dev.mysql.com/doc/internals/en/connection-phase-packets.html#packet-Protocol::AuthSwitchRequest

var Packet = require('../packets/packet');

function AuthSwitchRequest (opts)
{
  this.pluginName = opts.pluginName;
  this.pluginData = opts.pluginData;
}

AuthSwitchRequest.prototype.toPacket = function ()
{
  var length = 6 + this.pluginName.length + this.pluginData.length;
  var buffer = new Buffer(length);
  var packet = new Packet(0, buffer, 0, length);
  packet.offset = 4;
  packet.writeInt8(0xfe);
  packet.writeNullTerminatedString(this.pluginName);
  packet.writeBuffer(this.pluginData);
  return packet;
};

AuthSwitchRequest.fromPacket = function (packet)
{
  var marker = packet.readInt8();
  // assert marker == 0xfe?

  var name = packet.readNullTerminatedString();
  var data = packet.readBuffer();

  return new AuthSwitchRequest({
    pluginName: name,
    pluginData: data
  });
};

module.exports = AuthSwitchRequest;

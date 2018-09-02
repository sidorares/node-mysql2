// http://dev.mysql.com/doc/internals/en/connection-phase-packets.html#packet-Protocol::AuthSwitchRequest

const Packet = require('../packets/packet');

class AuthSwitchRequest {
  constructor(opts) {
    this.pluginName = opts.pluginName;
    this.pluginData = opts.pluginData;
  }

  toPacket() {
    var length = 6 + this.pluginName.length + this.pluginData.length;
    var buffer = Buffer.allocUnsafe(length);
    var packet = new Packet(0, buffer, 0, length);
    packet.offset = 4;
    packet.writeInt8(0xfe);
    // TODO: use server encoding
    packet.writeNullTerminatedString(this.pluginName, 'cesu8');
    packet.writeBuffer(this.pluginData);
    return packet;
  }
  
  static fromPacket(packet) {
    var marker = packet.readInt8();
    // assert marker == 0xfe?
    // TODO: use server encoding
    var name = packet.readNullTerminatedString('cesu8');
    var data = packet.readBuffer();
    return new AuthSwitchRequest({
      pluginName: name,
      pluginData: data
    });
  }
}



module.exports = AuthSwitchRequest;

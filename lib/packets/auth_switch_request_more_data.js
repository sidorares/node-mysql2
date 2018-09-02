// http://dev.mysql.com/doc/internals/en/connection-phase-packets.html#packet-Protocol::AuthSwitchRequest

const Packet = require('../packets/packet');

class AuthSwitchRequestMoreData {
  constructor(data) {
    this.data = data;
  }
  
  toPacket() {
    var length = 5 + this.data.length;
    var buffer = Buffer.allocUnsafe(length);
    var packet = new Packet(0, buffer, 0, length);
    packet.offset = 4;
    packet.writeInt8(0x01);
    packet.writeBuffer(this.data);
    return packet;
  }

  static fromPacket(packet) {
    var marker = packet.readInt8();
    var data = packet.readBuffer();
    return new AuthSwitchRequestMoreData(data);
  }

  static verifyMarker(packet) {
    return packet.peekByte() == 0x01;
  }
}

module.exports = AuthSwitchRequestMoreData;

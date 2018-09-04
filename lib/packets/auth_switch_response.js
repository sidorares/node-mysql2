// http://dev.mysql.com/doc/internals/en/connection-phase-packets.html#packet-Protocol::AuthSwitchRequest

const Packet = require('../packets/packet');

class AuthSwitchResponse {
  constructor(data) {
    if (!Buffer.isBuffer(data)) {
      data = Buffer.from(data);
    }
    this.data = data;
  }

  toPacket() {
    var length = 4 + this.data.length;
    var buffer = Buffer.allocUnsafe(length);
    var packet = new Packet(0, buffer, 0, length);
    packet.offset = 4;
    packet.writeBuffer(this.data);
    return packet;
  }

  static fromPacket(packet) {
    var data = packet.readBuffer();
    return new AuthSwitchResponse(data);
  }
}

module.exports = AuthSwitchResponse;

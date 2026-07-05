'use strict';

const ClientConstants = require('../constants/client');
const Packet = require('../packets/packet');

class SSLRequest {
  constructor(flags, charset, mariadbExtendedClientFlags) {
    this.clientFlags = flags | ClientConstants.SSL;
    this.charset = charset;
    this.mariadbExtendedClientFlags = mariadbExtendedClientFlags || 0;
  }

  toPacket() {
    const length = 36;
    const buffer = Buffer.allocUnsafe(length);
    const packet = new Packet(0, buffer, 0, length);
    buffer.fill(0);
    packet.offset = 4;
    packet.writeInt32(this.clientFlags);
    packet.writeInt32(0); // max packet size. todo: move to config
    packet.writeInt8(this.charset);
    // the last 4 of the 23 reserved bytes carry the MariaDB extended client
    // capabilities (zero when not negotiated, i.e. plain filler)
    packet.skip(19);
    packet.writeInt32(this.mariadbExtendedClientFlags);
    return packet;
  }
}

module.exports = SSLRequest;

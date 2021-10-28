'use strict';

const Packet = require('../packets/packet');
const CommandCodes = require('../constants/commands');

class ResetConnection {
  constructor() {
  }

  toPacket() {
    const packet = new Packet(0, Buffer.allocUnsafe(5), 0, 5);
    packet.offset = 4;
    packet.writeInt8(CommandCodes.RESET_CONNECTION);
    return packet;
  }
}

module.exports = ResetConnection;

'use strict';

const Command = require('./command');
const Packets = require('../packets/index.js');

class ResetConnection extends Command {
  constructor(callback) {
    super();
    this.onResult = callback;
  }

  start(packet, connection) {
    const req = new Packets.ResetConnection();
    connection.writePacket(req.toPacket());
    return ResetConnection.prototype.resetConnectionResponse;
  }

  resetConnectionResponse() {
    if (this.onResult) {
      process.nextTick(this.onResult.bind(this));
    }
    return null;
  }
}

module.exports = ResetConnection;

'use strict';

const Command = require('../command.js');

class ServerQuit extends Command {
  constructor(handler) {
    super();
    this._handler = handler;
  }

  start(packet, connection) {
    packet.readInt8();
    Promise.resolve()
      .then(() => this._handler())
      .catch(() => {})
      .then(() => {
        connection.stream.end();
      });
    return null;
  }
}

module.exports = ServerQuit;

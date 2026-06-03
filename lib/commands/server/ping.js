'use strict';

const Command = require('../command.js');
const { sendResult, sendError } = require('./send_result.js');

class ServerPing extends Command {
  constructor(handler) {
    super();
    this._handler = handler;
  }

  start(packet, connection) {
    packet.readInt8();
    let result;
    try {
      result = this._handler();
    } catch (err) {
      sendError(connection, err);
      return null;
    }
    if (result && typeof result.then === 'function') {
      result
        .then(() => sendResult(connection, undefined))
        .catch((err) => sendError(connection, err))
        .then(() => {
          this.next = null;
          this.emit('end');
          connection._command = connection._commands.shift();
          if (connection._command) {
            connection.sequenceId = 0;
            connection.compressedSequenceId = 0;
            connection.handlePacket();
          }
        });
      return ServerPing.prototype._awaitResult;
    }
    sendResult(connection, undefined);
    return null;
  }

  _awaitResult() {
    return ServerPing.prototype._awaitResult;
  }
}

module.exports = ServerPing;

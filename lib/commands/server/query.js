'use strict';

const Command = require('../command.js');
const Packets = require('../../packets/index.js');
const { sendResult, sendError } = require('./send_result.js');

class ServerQuery extends Command {
  constructor(handler) {
    super();
    this._handler = handler;
  }

  start(packet, connection) {
    const encoding =
      (connection.clientHelloReply && connection.clientHelloReply.encoding) ||
      'utf8';
    const queryPacket = Packets.Query.fromPacket(packet, encoding);
    let result;
    try {
      result = this._handler(queryPacket.query);
    } catch (err) {
      sendError(connection, err);
      return null;
    }
    if (result && typeof result.then === 'function') {
      this._handleAsync(result, connection);
      return ServerQuery.prototype._awaitResult;
    }
    sendResult(connection, result);
    return null;
  }

  _handleAsync(promise, connection) {
    promise
      .then((val) => sendResult(connection, val))
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
  }

  _awaitResult() {
    return ServerQuery.prototype._awaitResult;
  }
}

module.exports = ServerQuery;

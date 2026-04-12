'use strict';

const CommandCode = require('../../constants/commands.js');
const ServerQuery = require('./query.js');
const ServerPing = require('./ping.js');
const ServerQuit = require('./quit.js');
const ServerInitDb = require('./init_db.js');
const { sendError } = require('./send_result.js');
const Command = require('../command.js');

function defaultPing() {}
function defaultQuit() {}
function defaultInitDb() {}

function buildHandleCommand(handlers) {
  const queryHandler = handlers.query;
  const pingHandler = handlers.ping || defaultPing;
  const quitHandler = handlers.quit || defaultQuit;
  const initDbHandler = handlers.init_db || defaultInitDb;
  const fallback = handlers.handleCommand;

  return function handleCommand(commandCode) {
    switch (commandCode) {
      case CommandCode.QUERY:
        if (queryHandler) {
          return new ServerQuery(queryHandler);
        }
        break;
      case CommandCode.PING:
        return new ServerPing(pingHandler);
      case CommandCode.QUIT:
        return new ServerQuit(quitHandler);
      case CommandCode.INIT_DB:
        return new ServerInitDb(initDbHandler);
    }

    if (fallback) {
      return fallback(commandCode);
    }

    const cmd = new Command();
    cmd.start = function (_packet, connection) {
      sendError(connection, new Error('Command not supported'));
      return null;
    };
    return cmd;
  };
}

module.exports = {
  ServerQuery,
  ServerPing,
  ServerQuit,
  ServerInitDb,
  buildHandleCommand,
};

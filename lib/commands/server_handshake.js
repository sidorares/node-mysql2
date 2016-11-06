var util = require('util');

var ClientConstants = require('../constants/client.js');
var CommandCode = require('../constants/commands.js');
var Errors = require('../constants/errors.js');

var Command = require('./command.js');
var Packets = require('../packets/index.js');
var auth41 = require('../auth_41.js');

function ServerHandshake (args)
{
  Command.call(this);
  this.args = args;
  /*
  this.protocolVersion = args.protocolVersion || 10;
  this.serverVersion   = args.serverVersion;
  this.connectionId    = args.connectionId,
  this.statusFlags     = args.statusFlags,
  this.characterSet    = args.characterSet,
  this.capabilityFlags = args.capabilityFlags || 512;
  */
}
util.inherits(ServerHandshake, Command);

ServerHandshake.prototype.start = function (packet, connection) {
  var serverHelloPacket = new Packets.Handshake(this.args);
  this.serverHello = serverHelloPacket;
  serverHelloPacket.setScrambleData(function (err) {
    if (err) {
      connection.emit('error', new Error('Error generating random bytes'));
      return;
    }
    connection.writePacket(serverHelloPacket.toPacket(0));
  });
  return ServerHandshake.prototype.readClientReply;
};

ServerHandshake.prototype.readClientReply = function (packet, connection) {
  // check auth here
  var clientHelloReply = new Packets.HandshakeResponse.fromPacket(packet);

  // TODO check we don't have something similar already
  connection.clientHelloReply = clientHelloReply;

  if (this.args.authCallback) {
    try {
      this.args.authCallback({
        user: clientHelloReply.user,
        database: clientHelloReply.database,
        address: connection.stream.remoteAddress,
        authPluginData1: this.serverHello.authPluginData1,
        authPluginData2: this.serverHello.authPluginData2,
        authToken: clientHelloReply.authToken
      }, function (err, mysqlError) {
        // if (err)
        if (!mysqlError) {
          connection.writeOk();
        } else {
          // TODO create constants / errorToCode
          // 1045 = ER_ACCESS_DENIED_ERROR
          connection.writeError({message: mysqlError.message || '', code: mysqlError.code || 1045});
          connection.close();
        }
      });
    } catch (err) {
      throw err;
      // TODO
      // connection.writeError(err)
    }
  } else {
    connection.writeOk();
  }
  return ServerHandshake.prototype.dispatchCommands;
};

ServerHandshake.prototype.dispatchCommands = function (packet, connection) {
  // command from client to server
  var knownCommand = true;
  var encoding = connection.clientHelloReply.encoding;
  connection._resetSequenceId();
  var commandCode = packet.readInt8();
  switch (commandCode) {
  case CommandCode.QUIT:
    if (connection.listeners('quit').length) {
      connection.emit('quit');
    } else {
      connection.stream.end();
    }
    break;

  case CommandCode.INIT_DB:
    if (connection.listeners('init_db').length) {
      var schemaName = packet.readString(encoding);
      connection.emit('init_db', schemaName);
    } else {
      connection.writeOk();
    }
    break;

  case CommandCode.QUERY:
    if (connection.listeners('query').length) {
      var query = packet.readString(undefined, encoding);
      connection.emit('query', query);
    } else {
      connection.writeError({
        code: Errors.HA_ERR_INTERNAL_ERROR,
        message: 'No query handler'
      });
    }
    break;

  case CommandCode.FIELD_LIST:
    if (connection.listeners('field_list').length) {
      var table = packet.readNullTerminatedString();
      var fields = packet.readString(encoding);
      connection.emit('field_list', table, fields);
    } else {
      connection.writeError({
        code: Errors.ER_WARN_DEPRECATED_SYNTAX,
        message: 'As of MySQL 5.7.11, COM_FIELD_LIST is deprecated and will be removed in a future version of MySQL.'
      });
    }
    break;

  case CommandCode.PING:
    if (connection.listeners('ping').length) {
      connection.emit('ping');
    } else {
      connection.writeOk();
    }
    break;

  default:
    knownCommand = false;
  }

  if (connection.listeners('packet').length) {
    connection.emit('packet', packet.clone(), knownCommand, commandCode);
  } else {
    if (!knownCommand) {
      console.log('Unknown command:', commandCode);
    }
  }

  return ServerHandshake.prototype.dispatchCommands;
};

module.exports = ServerHandshake;

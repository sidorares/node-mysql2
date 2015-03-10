var util     = require('util');

var ClientConstants = require('../constants/client.js');
var CommandCode     = require('../constants/commands.js');

var Command  = require('./command.js');
var Packets  = require('../packets/index.js');
var auth41   = require('../auth_41.js');

function ServerHandshake(args)
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

ServerHandshake.prototype.start = function(packet, connection) {
  var serverHelloPacket = new Packets.Handshake(this.args);
  this.serverHello = serverHelloPacket;
  serverHelloPacket.setScrambleData(function(err) {
    if (err)
      return connection.emit('error', new Error('Error generating random bytes'));
    connection.writePacket(serverHelloPacket.toPacket(0));
  });
  return ServerHandshake.prototype.readClientReply;
};

ServerHandshake.prototype.readClientReply = function(packet, connection) {
  // check auth here
  var clientHelloReply = new Packets.HandshakeResponse.fromPacket(packet);
  if (this.args.authCallback) {
    try {
      this.args.authCallback({
        user: clientHelloReply.user,
        database: clientHelloReply.database,
        address: connection.stream.remoteAddress,
        authPluginData1: this.serverHello.authPluginData1,
        authPluginData2: this.serverHello.authPluginData2,
        authToken: clientHelloReply.authToken,
      }, function(err, mysqlError) {
        //if (err)
        if (!mysqlError)
          connection.writeOk();
        else {
          // TODO create constants / errorToCode
          // 1045 = ER_ACCESS_DENIED_ERROR
          connection.writeError({ message: mysqlError.message || '',  code: mysqlError.code || 1045 });
          connection.close();
        }
      });
    } catch(err) {
      throw err;
      // TODO
      // connection.writeError(err)
    }
  } else {
    connection.writeOk();
  }
  return ServerHandshake.prototype.dispatchCommands;
};

ServerHandshake.prototype.dispatchCommands = function(packet, connection) {
  // command from client to server
  var commandCode = packet.readInt8();
  switch (commandCode) {
  case CommandCode.QUIT:
    connection.emit('quit');
    // connection.stream.end();
    break;
  case CommandCode.INIT_DB:
    var schemaName = packet.readString();
    connection.emit('init_db', schemaName);
    connection.writeOk();
    break;
  case CommandCode.PING:
    // allow custom ping response (delayed/incorrect/etc)
    // if no listeners, respond with OK
    if (connection.listeners('ping').length === 0) {
      connection.writeOk();
    } else {
      connection.emit('ping');
    }
    break;
  case CommandCode.QUERY:
    var query = packet.readString();
    connection.emit('query', query);
    break;
  case CommandCode.FIELD_LIST:
    var table = packet.readNullTerminatedString();
    var fields = packet.readString();
    connection.emit('field_list', table, fields);
    break;
  default:
    console.log('Unknown command:', commandCode);
  }
  return ServerHandshake.prototype.dispatchCommands;
};

module.exports = ServerHandshake;

// TODO: implement server-side 4.1 authentication
/*
4.1 authentication: (http://bazaar.launchpad.net/~mysql/mysql-server/5.5/view/head:/sql/password.c)

  SERVER:  public_seed=create_random_string()
           send(public_seed)

  CLIENT:  recv(public_seed)
           hash_stage1=sha1("password")
           hash_stage2=sha1(hash_stage1)
           reply=xor(hash_stage1, sha1(public_seed,hash_stage2)

           // this three steps are done in scramble()

           send(reply)


  SERVER:  recv(reply)
           hash_stage1=xor(reply, sha1(public_seed,hash_stage2))
           candidate_hash2=sha1(hash_stage1)
           check(candidate_hash2==hash_stage2)

server stores sha1(sha1(password)) ( hash_stag2)
*/

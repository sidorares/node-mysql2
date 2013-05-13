var Command  = require('./command');
var Packets  = require('../packets/index.js');
var util    = require('util');
var ClientConstants = require('../constants/client');
var CommandCode = require('../constants/commands');

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
  serverHelloPacket.setScrambleData(function(err) {
    connection.writePacket(serverHelloPacket.toPacket(0));
  });
  return ServerHandshake.prototype.readClientReply;
};

ServerHandshake.prototype.readClientReply = function(packet, connection) {
  // TODO connection.writeOk();
  var ok = new Buffer([0x07, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00]);
  connection.write(ok);
  return ServerHandshake.prototype.dispatchCommands;
};

ServerHandshake.prototype.dispatchCommands = function(packet, connection) {
  // command from client to server
  var commandCode = packet.readInt8();
  switch (commandCode) {
  case CommandCode.QUIT:
    connection.stream.end();
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

var util     = require('util');

var Command  = require('./command.js');
var Packets  = require('../packets/index.js');
var ClientConstants = require('../constants/client.js');

function ClientHandshake(clientFlags)
{
  this.handshake = null;
  this.clientFlags = clientFlags;
  Command.call(this);
}
util.inherits(ClientHandshake, Command);

ClientHandshake.prototype.start = function() {
  return ClientHandshake.prototype.handshakeInit;
};

ClientHandshake.prototype.sendSSLRequest = function(connection) {
  var sslRequest = new Packets.SSLRequest(this.clientFlags);
  connection.writePacket(sslRequest.toPacket());
};

function flagNames(flags) {
  var res = [];
  for (var c in ClientConstants) {
    if (flags & ClientConstants[c])
     res.push(c.replace(/_/g, ' ').toLowerCase());
  }
  return res;
}

ClientHandshake.prototype.sendCredentials = function(connection) {
  if (connection.config.debug) {
    console.log('Sending handshake packet: flags:%d=(%s)', this.clientFlags,
      flagNames(this.clientFlags).join(', '));
  }
  var handshakeResponse = new Packets.HandshakeResponse({
    flags   : this.clientFlags,
    user    : connection.config.user,
    database: connection.config.database,
    password: connection.config.password,
    passwordSha1   : connection.config.passwordSha1,
    charsetNumber  : connection.config.charsetNumber,
    authPluginData1: this.handshake.authPluginData1,
    authPluginData2: this.handshake.authPluginData2,
    compress: connection.config.compress
  });
  connection.writePacket(handshakeResponse.toPacket());
};

ClientHandshake.prototype.handshakeInit = function(helloPacket, connection) {
  var command = this;

  this.on('connect', function(connArgs) {
    connection.emit('connect', connArgs);
  });
  this.on('error', function(err) {
    connection._protocolError = err;
    connection.emit('error', err);
  });
  this.handshake = Packets.Handshake.fromPacket(helloPacket);
  if (connection.config.debug) {
    console.log('Server hello packet: capability flags:%d=(%s)', this.handshake.capabilityFlags,
      flagNames(this.handshake.capabilityFlags).join(', '));
  }
  connection.serverCapabilityFlags = this.handshake.capabilityFlags;
  connection.connectionId = this.handshake.connectionId;
  var serverSSLSupport = this.handshake.capabilityFlags & ClientConstants.SSL;

  // use compression only if requested by client and supported by server
  connection.config.compress = connection.config.compress && (this.handshake.capabilityFlags & ClientConstants.COMPRESS);
  this.clientFlags = this.clientFlags | connection.config.compress;

  if (connection.config.ssl) {
    if (!serverSSLSupport)
      command.emit('error', new Error('Server does not support secure connnection'));
    // send ssl upgrade request and immediately upgrade connection to secure
    this.clientFlags |= ClientConstants.SSL;
    this.sendSSLRequest(connection);
    connection.startTLS(function() {
      // after connection is secure
      command.sendCredentials(connection);
    });
  } else {
    this.sendCredentials(connection);
  }
  return ClientHandshake.prototype.handshakeResult;
};

ClientHandshake.prototype.handshakeResult = function(okPacket, connection) {
  // error is already checked in base class. Done auth.
  connection.authorized = true;
  if (connection.config.compress)
    connection.packetParser.onPacket = connection.handleCompressedPacket.bind(connection);
  // TODO any useful information in ok packet to pass as argument?
  connection.emit('connect', true);
  return null;
};
module.exports = ClientHandshake;

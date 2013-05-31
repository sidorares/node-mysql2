var Command  = require('./command');
var Packets  = require('../packets/index.js');
var util    = require('util');
var ClientConstants = require('../constants/client');

function ClientHandshake()
{
  this.handshake = null;
  Command.call(this);
}
util.inherits(ClientHandshake, Command);

ClientHandshake.prototype.start = function() {
  return ClientHandshake.prototype.handshakeInit;
};

ClientHandshake.prototype.sendSSLRequest = function(connection) {
  // TODO: I don't like the fact that ssl flags packet to be shorter AND set flag bit
  // should be something like { ssl: true, sslRequest: true } for sslRequest packet
  // and { ..., ssl: true } for ghandshakeReply packet
  var sslRequest = new Packets.HandshakeResponse({ ssl: true });
  connection.writePacket(sslRequest.toPacket(1));
};

ClientHandshake.prototype.sendCredentials = function(connection, packetIndex) {
  var handshakeResponse = new Packets.HandshakeResponse({
    password: connection.config.password,
    user    : connection.config.user,
    database: connection.config.database,
    authPluginData1: this.handshake.authPluginData1,
    authPluginData2: this.handshake.authPluginData2,
    compress: connection.config.compress
  });
  connection.writePacket(handshakeResponse.toPacket(packetIndex));
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
  connection.serverCapabilityFlags = this.handshake.capabilityFlags;
  var serverSSLSupport = this.handshake.capabilityFlags & ClientConstants.SSL;

  // use compression only if requested by client and supported by server
  connection.config.compress = connection.config.compress && (this.handshake.capabilityFlags & ClientConstants.COMPRESS);

  if (connection.config.ssl) {
    if (!serverSSLSupport)
      throw new Error('Server does not support secure connnection');
    // send ssl upgrade request and immediately upgrade connection to secure
    this.sendSSLRequest(connection);
    connection.startTLS(function() {
      // after connection is secure
      command.sendCredentials(connection, 2);
    });
  } else {
    this.sendCredentials(connection, 1);
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

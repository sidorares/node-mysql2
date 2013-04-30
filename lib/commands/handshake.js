var Command  = require('./command');
var Packets  = require('../packets/index.js');
var util    = require('util');
var ClientConstants = require('../constants/client');

function Handshake()
{
  this.handshake = null;
  Command.call(this);
}
util.inherits(Handshake, Command);

Handshake.prototype.start = function() {
  return Handshake.prototype.handshakeInit;
};

Handshake.prototype.sendSSLRequest = function(connection) {
  var sslRequest = new Packets.HandshakeResponse({ ssl: true });
  connection.writePacket(sslRequest.toPacket(1));
};

Handshake.prototype.sendCredentials = function(connection, packetIndex) {
  var handshakeResponse = new Packets.HandshakeResponse({
    password: connection.opts.password,
    user    : connection.opts.user,
    database: connection.opts.database,
    authPluginData1: this.handshake.authPluginData1,
    authPluginData2: this.handshake.authPluginData2
  });
  connection.writePacket(handshakeResponse.toPacket(packetIndex));
};

Handshake.prototype.handshakeInit = function(helloPacket, connection) {
  var command = this;
  this.handshake = new Packets.Handshake(helloPacket);
  var serverSSLSupport = this.handshake.capabilityFlags & ClientConstants.SSL;
  if (connection.opts.ssl) {
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
  return Handshake.prototype.handshakeResult;
};

Handshake.prototype.handshakeResult = function(okPacket) {
  // error is already checked in base class. Done auth.
  return null;
};
module.exports = Handshake;

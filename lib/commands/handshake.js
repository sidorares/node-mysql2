var Command  = require('./command');
var Packets  = require('../packets/index.js');
var util    = require('util');
var ClientConstants = require('../constants/client');

function Handshake()
{
  Command.call(this);
}
util.inherits(Handshake, Command);

Handshake.prototype.start = function() {
  return Handshake.prototype.handshakeInit;
};

Handshake.prototype.handshakeInit = function(init, connection) {
  var handshake = new Packets.Handshake(init);
  var serverSSLSupport = handshake.capabilityFlags & ClientConstants.SSL;
  var sslRequest;
  if (connection.opts.ssl) {
    if (!serverSSLSupport)
      throw new Error('Server does not support secure connnection');
    // send ssl upgrade request and immediately upgrade connection to secure
    sslRequest = Packets.HandshakeResponse({ ssl: true });
    connection.writePacket(sslRequest.toPacket());
    connection.startTLS();
  }
  var initReply = new Packets.HandshakeResponse({
    password: connection.opts.password,
    user    : connection.opts.user,
    database: connection.opts.database,
    authPluginData1: handshake.authPluginData1,
    authPluginData2: handshake.authPluginData2
  });
  connection.writePacket(initReply.toPacket());
  return Handshake.prototype.handshakeResult;
};

Handshake.prototype.handshakeResult = function(okPacket) {
  // error is already checked in base class. Done auth.
  return null;
};
module.exports = Handshake;

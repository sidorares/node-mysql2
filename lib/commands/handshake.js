var Command  = require('./command');
var Packets  = require('../packets/index.js');
var util    = require('util');

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

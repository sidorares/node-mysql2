var util     = require('util');

var Command  = require('./command.js');
var Packets  = require('../packets/index.js');
var ClientConstants = require('../constants/client.js');

function ChangeUser(options, callback)
{
  this.onResult      = callback;
  this._user          = options.user;
  this._password      = options.password;
  this._database      = options.database;
  this._passwordSha1  = options.passwordSha1;
  this._charsetNumber = options.charsetNumber;
  this._currentConfig = options.currentConfig;
  Command.call(this);
}
util.inherits(ChangeUser, Command);

ChangeUser.prototype.start = function(packet, connection) {
  var packet = new Packets.ChangeUser({
    user            : this._user,
    database        : this._database,
    charsetNumber   : this._charsetNumber,
    password        : this._password,
    passwordSha1    : this._passwordSha1,
    authPluginData1 : connection._handshakePacket.authPluginData1,
    authPluginData2 : connection._handshakePacket.authPluginData2
  });
  this._currentConfig.user          = this._user;
  this._currentConfig.password      = this._password;
  this._currentConfig.database      = this._database;
  this._currentConfig.charsetNumber = this._charsetNumber;
  // reset prepared statements cache as all statements become invalid after changeUser
  connection._statements = {};
  connection.writePacket(packet.toPacket());
  return ChangeUser.prototype.changeOk;
};

ChangeUser.prototype.changeOk = function(okPacket, connection) {
  if (this.onResult)
    this.onResult(null);
  return null;
};
module.exports = ChangeUser;

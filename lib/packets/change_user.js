var CommandCode     = require('../constants/commands.js');
var Packet          = require('../packets/packet.js');

var auth41 = require('../auth_41.js');

function ChangeUser(opts)
{
  this.user            = opts.user || '';
  this.database        = opts.database || '';
  this.password        = opts.password || '';
  this.passwordSha1    = opts.passwordSha1;
  this.authPluginData1 = opts.authPluginData1;
  this.authPluginData2 = opts.authPluginData2;
  var authToken;
  if (this.passwordSha1) {
    authToken = auth41.calculateTokenFromPasswordSha(this.passwordSha1, this.authPluginData1, this.authPluginData2);
  } else {
    authToken = auth41.calculateToken(this.password, this.authPluginData1, this.authPluginData2);
  }
  this.authToken       = authToken;
  this.charsetNumber   = opts.charsetNumber;
}

// TODO
//ChangeUser.fromPacket = function(packet)
//};

ChangeUser.prototype.toPacket = function()
{
  if (typeof this.user != 'string')
    throw new Error('"user" connection config prperty must be a string');
  if (typeof this.database != 'string')
    throw new Error('"database" connection config prperty must be a string');

  var length = 4 + 1 + (1 + this.authToken.length) + (2 + this.user.length + this.database.length) + 2;

  var buffer = new Buffer(length);
  var packet = new Packet(0, buffer, 0, length);
  packet.offset = 4;

  packet.writeInt8(CommandCode.CHANGE_USER);
  packet.writeNullTerminatedString(this.user);
  packet.writeInt8(this.authToken.length);
  packet.writeBuffer(this.authToken);
  packet.writeNullTerminatedString(this.database);
  packet.writeInt16(this.charsetNumber);
  return packet;
};

module.exports = ChangeUser;

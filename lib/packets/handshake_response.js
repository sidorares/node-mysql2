var ClientConstants = require('../constants/client.js');
var Charsets        = require('../constants/charsets.js');
var Packet          = require('../packets/packet.js');

var auth41 = require('../auth_41.js');

function HandshakeResponse(handshake)
{
  this.user            = handshake.user || '';
  this.database        = handshake.database || '';
  this.password        = handshake.password || '';
  this.passwordSha1    = handshake.passwordSha1;
  this.authPluginData1 = handshake.authPluginData1;
  this.authPluginData2 = handshake.authPluginData2;
  this.compress        = handshake.compress;
  this.clientFlags     = handshake.flags;
  // TODO: pre-4.1 auth support
  var authToken;
  if (this.passwordSha1)
    authToken = auth41.calculateTokenFromPasswordSha(this.passwordSha1, this.authPluginData1, this.authPluginData2);
  else
    authToken = auth41.calculateToken(this.password, this.authPluginData1, this.authPluginData2);
  this.authToken       = authToken;
  this.charsetNumber   = handshake.charsetNumber;
}

HandshakeResponse.fromPacket = function(packet)
{
  var args = {};
  //packet.skip(4);
  args.clientFlags   = packet.readInt32();
  args.maxPacketSize = packet.readInt32();
  args.charsetNumber = packet.readInt8();
  packet.skip(23);
  args.user = packet.readNullTerminatedString();
  var authTokenLength = packet.readInt8();
  args.authToken = packet.readBuffer(authTokenLength);
  args.database  = packet.readNullTerminatedString();
  //return new HandshakeResponse(args);
  return args;
};

HandshakeResponse.prototype.toPacket = function()
{
  if (typeof this.user != 'string')
    throw new Error('"user" connection config prperty must be a string');
  if (typeof this.database != 'string')
    throw new Error('"database" connection config prperty must be a string');

  var length = 36 + 23 + this.user.length + this.database.length;

  var buffer = new Buffer(length);
  var packet = new Packet(0, buffer, 0, length);
  buffer.fill(0);
  packet.offset = 4;

  packet.writeInt32(this.clientFlags);
  packet.writeInt32(0); // max packet size. todo: move to config
  packet.writeInt8(this.charsetNumber);
  packet.skip(23);
  packet.writeNullTerminatedString(this.user);
  packet.writeInt8(this.authToken.length);
  packet.writeBuffer(this.authToken);
  packet.writeNullTerminatedString(this.database);
  return packet;
};

module.exports = HandshakeResponse;

var _ = require('underscore');
var constants = require('../constants');
var crypto = require('crypto');
var Packet = require('../packets/packet');

function sha1(msg, msg1, msg2) {
  var hash = crypto.createHash('sha1');
  hash.update(msg);
  if (msg1)
    hash.update(msg1);
  if (msg2)
    hash.update(msg2);
  return hash.digest('binary');
}

function xor(a, b) {
  if (!Buffer.isBuffer(a))
    a = new Buffer(a, 'binary');
  if (!Buffer.isBuffer(b))
    b = new Buffer(b, 'binary');
  var result = new Buffer(a.length);
  for (var i = 0; i < a.length; i++) {
    result[i] = (a[i] ^ b[i]);
  }
  return result;
}

function token(password, scramble1, scramble2) {
  var scramble = Buffer(scramble1.toString('binary') + scramble2.toString('binary'));
  if (!password) {
    return new Buffer(0);
  }
  var stage1 = sha1(Buffer(password, "utf8").toString('binary'));
  var stage2 = sha1(stage1);
  var stage3 = sha1(scramble1, scramble2, stage2);
  return xor(stage3, stage1);
}

function HandshakeResponse(handshake)
{
  _.extend(this, handshake);
  this.authToken = token(this.password, this.authPluginData1, this.authPluginData2);
}

HandshakeResponse.prototype.toPacket = function()
{
  // TODO: cleanup
  this.clientFlags = 0x02f3cf; //constants.CLIENT_PROTOCOL_41;
  this.characterSet = 0x21;

  var length = 59 + this.user.length + this.database.length;
  var buffer = new Buffer(length);
  var packet = new Packet(1, buffer);
  buffer.fill(0);
  packet.offset = 4;
  packet.writeInt32(this.clientFlags);
  packet.writeInt32(0); // max packet size. todo: move to config
  packet.writeInt8(this.characterSet);
  packet.skip(23);
  packet.writeNullTerminatedString(this.user);
  packet.writeInt8(this.authToken.length);
  packet.writeBuffer(this.authToken);
  packet.writeNullTerminatedString(this.database);
  return packet;
};

module.exports = HandshakeResponse;

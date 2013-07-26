var ClientConstants = require('../constants/client');
var Charsets = require('../constants/charsets');
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
  if (handshake.ssl) {
    this.ssl = true;
    return;
  }
  this.ssl = false;
  this.user            = handshake.user || '';
  this.database        = handshake.database || '';
  this.password        = handshake.password || '';
  this.authPluginData1 = handshake.authPluginData1;
  this.authPluginData2 = handshake.authPluginData2;
  this.compress        = handshake.compress;
  this.authToken = token(this.password, this.authPluginData1, this.authPluginData2);
}

HandshakeResponse.prototype.toPacket = function(packetIndex, flags)
{
  /*
  var flags =
    ClientConstants.LONG_PASSWORD | ClientConstants.FOUND_ROWS | ClientConstants.LONG_FLAG | ClientConstants.MULTI_STATEMENTS |
    ClientConstants.CONNECT_WITH_DB | ClientConstants.ODBC | ClientConstants.MULTI_RESULTS |
    ClientConstants.SECURE_CONNECTION | ClientConstants.RESERVED | ClientConstants.TRANSACTIONS |
    ClientConstants.IGNORE_SIGPIPE | ClientConstants.PROTOCOL_41 | ClientConstants.IGNORE_SPACE | ClientConstants.LOCAL_FILES;
  */
  var clientFlags = flags;
  var characterSet = Charsets.UTF8_GENERAL_CI;

  var length = 36;
  // TODO replace it with sslRequest parameter, make ssl to flag just clientFlags, not packet length
  if (!this.ssl)
    length += 23 + this.user.length + this.database.length;

  var buffer = new Buffer(length);
  var packet = new Packet(packetIndex, buffer);
  buffer.fill(0);
  packet.offset = 4;

  if (this.ssl)
    this.clientFlags |= ClientConstants.SSL;
  if (this.compress)
    this.clientFlags |= ClientConstants.COMPRESS;

  packet.writeInt32(clientFlags);
  packet.writeInt32(0); // max packet size. todo: move to config
  packet.writeInt8(characterSet);
  packet.skip(23);
  if (!this.ssl) {
    packet.writeNullTerminatedString(this.user);
    packet.writeInt8(this.authToken.length);
    packet.writeBuffer(this.authToken);
    packet.writeNullTerminatedString(this.database);
  }
  return packet;
};

module.exports = HandshakeResponse;

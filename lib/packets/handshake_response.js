var Buffer = require('safe-buffer').Buffer;

var ClientConstants = require('../constants/client.js');
var Charsets = require('../constants/charsets.js');
var CharsetToEncoding = require('../constants/charset_encodings.js');
var Packet = require('../packets/packet.js');

var auth41 = require('../auth_41.js');

function HandshakeResponse (handshake)
{
  this.user = handshake.user || '';
  this.database = handshake.database || '';
  this.password = handshake.password || '';
  this.passwordSha1 = handshake.passwordSha1;
  this.authPluginData1 = handshake.authPluginData1;
  this.authPluginData2 = handshake.authPluginData2;
  this.compress = handshake.compress;
  this.clientFlags = handshake.flags;
  // TODO: pre-4.1 auth support
  var authToken;
  if (this.passwordSha1) {
    authToken = auth41.calculateTokenFromPasswordSha(this.passwordSha1, this.authPluginData1, this.authPluginData2);
  } else {
    authToken = auth41.calculateToken(this.password, this.authPluginData1, this.authPluginData2);
  }
  this.authToken = authToken;
  this.charsetNumber = handshake.charsetNumber;
  this.encoding = CharsetToEncoding[handshake.charsetNumber];
  this.connectAttributes = handshake.connectAttributes;
}

HandshakeResponse.fromPacket = function (packet)
{
  var args = {};
  args.clientFlags = packet.readInt32();

  function isSet (flag) {
    return args.clientFlags & ClientConstants[flag];
  }

  args.maxPacketSize = packet.readInt32();
  args.charsetNumber = packet.readInt8();
  var encoding = CharsetToEncoding[args.charsetNumber];
  args.encoding = encoding;
  packet.skip(23);
  args.user = packet.readNullTerminatedString(encoding);
  var authTokenLength;
  if (isSet('PLUGIN_AUTH_LENENC_CLIENT_DATA')) {
    authTokenLength = packet.readLengthCodedNumber(encoding);
    args.authToken = packet.readBuffer(authTokenLength);
  } else if (isSet('SECURE_CONNECTION')) {
    authTokenLength = packet.readInt8();
    args.authToken = packet.readBuffer(authTokenLength);
  } else {
    args.authToken = packet.readNullTerminatedString(encoding);
  } if (isSet('CONNECT_WITH_DB')) {
    args.database = packet.readNullTerminatedString(encoding);
  }
  if (isSet('PLUGIN_AUTH')) {
    args.authPluginName = packet.readNullTerminatedString(encoding);
  }
  if (isSet('CONNECT_ATTRS')) {
    var keysLength = packet.readLengthCodedNumber(encoding);
    var keysEnd = packet.offset + keysLength;
    var attrs = {};
    while (packet.offset < keysEnd) {
      attrs[packet.readLengthCodedString(encoding)] = packet.readLengthCodedString(encoding);
    }
    args.connectAttributes = attrs;
  }
  return args;
};

HandshakeResponse.prototype.serializeResponse = function (buffer) {
  var self = this;
  function isSet (flag) {
    return self.clientFlags & ClientConstants[flag];
  }

  var packet = new Packet(0, buffer, 0, buffer.length);
  packet.offset = 4;
  packet.writeInt32(this.clientFlags);
  packet.writeInt32(0); // max packet size. todo: move to config
  packet.writeInt8(this.charsetNumber);
  packet.skip(23);

  var encoding = this.encoding;
  packet.writeNullTerminatedString(this.user, encoding);

  var authTokenLength, k;
  if (isSet('PLUGIN_AUTH_LENENC_CLIENT_DATA')) {
    packet.writeLengthCodedNumber(this.authToken.length);
    packet.writeBuffer(this.authToken);
  } else if (isSet('SECURE_CONNECTION')) {
    packet.writeInt8(this.authToken.length);
    packet.writeBuffer(this.authToken);
  } else {
    packet.writeBuffer(this.authToken);
    packet.writeInt8(0);
  } if (isSet('CONNECT_WITH_DB')) {
    packet.writeNullTerminatedString(this.database, encoding);
  }
  if (isSet('PLUGIN_AUTH')) {
    // TODO: pass from config
    packet.writeNullTerminatedString('mysql_native_password', 'latin1');
  }
  if (isSet('CONNECT_ATTRS')) {
    var connectAttributes = this.connectAttributes || {};
    var attrNames = Object.keys(connectAttributes);
    var keysLength = 0;
    for (k = 0; k < attrNames.length; ++k) {
      keysLength += Packet.lengthCodedStringLength(attrNames[k], encoding);
      keysLength += Packet.lengthCodedStringLength(connectAttributes[attrNames[k]], encoding);
    }
    packet.writeLengthCodedNumber(keysLength);
    for (k = 0; k < attrNames.length; ++k) {
      packet.writeLengthCodedString(attrNames[k], encoding);
      packet.writeLengthCodedString(connectAttributes[attrNames[k]], encoding);
    }
  }
  return packet;
};

HandshakeResponse.prototype.toPacket = function ()
{
  if (typeof this.user != 'string') {
    throw new Error('"user" connection config prperty must be a string');
  }
  if (typeof this.database != 'string') {
    throw new Error('"database" connection config prperty must be a string');
  }
  // dry run: calculate resulting packet length
  var p = this.serializeResponse(Packet.MockBuffer());
  return this.serializeResponse(Buffer.allocUnsafe(p.offset));
};

module.exports = HandshakeResponse;

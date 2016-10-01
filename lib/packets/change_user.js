var Buffer = require('safe-buffer').Buffer;

var CommandCode = require('../constants/commands.js');
var ClientConstants = require('../constants/client.js');
var Packet = require('../packets/packet.js');
var auth41 = require('../auth_41.js');
var CharsetToEncoding = require('../constants/charset_encodings.js');


function ChangeUser (opts)
{
  this.flags = opts.flags;
  this.user = opts.user || '';
  this.database = opts.database || '';
  this.password = opts.password || '';
  this.passwordSha1 = opts.passwordSha1;
  this.authPluginData1 = opts.authPluginData1;
  this.authPluginData2 = opts.authPluginData2;
  this.connectAttributes = opts.connectAttrinutes || {};
  var authToken;
  if (this.passwordSha1) {
    authToken = auth41.calculateTokenFromPasswordSha(this.passwordSha1, this.authPluginData1, this.authPluginData2);
  } else {
    authToken = auth41.calculateToken(this.password, this.authPluginData1, this.authPluginData2);
  }
  this.authToken = authToken;
  this.charsetNumber = opts.charsetNumber;
}

// TODO
// ChangeUser.fromPacket = function(packet)
// };

ChangeUser.prototype.serializeToBuffer = function (buffer)
{
  var self = this;
  function isSet (flag) {
    return self.flags & ClientConstants[flag];
  }

  var packet = new Packet(0, buffer, 0, buffer.length);
  packet.offset = 4;

  var encoding = CharsetToEncoding[this.charsetNumber];

  packet.writeInt8(CommandCode.CHANGE_USER);
  packet.writeNullTerminatedString(this.user, encoding);
  if (isSet('SECURE_CONNECTION')) {
    packet.writeInt8(this.authToken.length);
    packet.writeBuffer(this.authToken);
  } else {
    packet.writeBuffer(this.authToken);
    packet.writeInt8(0);
  }
  packet.writeNullTerminatedString(this.database, encoding);
  packet.writeInt16(this.charsetNumber);

  if (isSet('PLUGIN_AUTH')) {
    packet.writeNullTerminatedString('mysql_native_password', 'latin1');
  }

  if (isSet('CONNECT_ATTRS')) {
    var connectAttributes = this.connectAttributes;
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

ChangeUser.prototype.toPacket = function ()
{
  if (typeof this.user != 'string') {
    throw new Error('"user" connection config property must be a string');
  }

  if (typeof this.database != 'string') {
    throw new Error('"database" connection config property must be a string');
  }

  // dry run: calculate resulting packet length
  var p = this.serializeToBuffer(Packet.MockBuffer());
  return this.serializeToBuffer(Buffer.allocUnsafe(p.offset));
};

module.exports = ChangeUser;

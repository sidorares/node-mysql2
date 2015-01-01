var Packet = require('../packets/packet');

function Handshake(args) {
  this.protocolVersion = args.protocolVersion;
  this.serverVersion   = args.serverVersion;
  this.capabilityFlags = args.capabilityFlags;
  this.connectionId    = args.connectionId;
  this.authPluginData1 = args.authPluginData1;
  this.authPluginData2 = args.authPluginData2;
  this.characterSet    = args.characterSet;
  this.statusFlags     = args.statusFlags;
}

Handshake.fromPacket = function(packet)
{
  var args = {};
  args.protocolVersion = packet.readInt8();
  args.serverVersion   = packet.readNullTerminatedString();
  args.connectionId    = packet.readInt32();
  args.authPluginData1 = packet.readBuffer(8);
  packet.skip(1);
  args.capabilityFlags = packet.readInt16();
  if (packet.haveMoreData()) {
    args.characterSet = packet.readInt8();
    args.statusFlags  = packet.readInt16();
    // upper 2 bytes
    args.capabilityFlags += packet.readInt16() << 16;
    args.authPluginDataLength = packet.readInt8();
    packet.skip(10);
  }
  //var len = Math.max(12, args.authPluginDataLength - 8);
  args.authPluginData2 = packet.readBuffer(12);
  return new Handshake(args);
};

Handshake.prototype.setScrambleData = function(cb) {
  var self = this;
  require('crypto').randomBytes(20, function(err, data) {
    if (err) return cb(err);
    self.authPluginData1 = data.slice(0, 8);
    self.authPluginData2 = data.slice(8,20);
    cb();
  });
};

Handshake.prototype.toPacket = function(sequenceId) {
  var buffer, packet;
  var length = 68 + Buffer.byteLength(this.serverVersion, 'utf8');
  buffer = new Buffer(length + 4);
  packet  = new Packet(sequenceId, buffer, 0, length + 4);
  packet.offset = 4;
  packet.writeInt8(this.protocolVersion);
  packet.writeString(this.serverVersion);
  packet.writeInt8(0);
  packet.writeInt32(this.connectionId);
  packet.writeBuffer(this.authPluginData1);
  packet.writeInt8(0);
  packet.writeInt16(this.capabilityFlags & 0xffff);
  packet.writeInt8(this.characterSet);
  packet.writeInt16(this.statusFlags);
  packet.writeInt16(this.capabilityFlags >> 16);
  packet.writeInt8(21); // authPluginDataLength
  var filler = new Buffer(10);
  filler.fill(0);
  packet.writeBuffer(filler);
  packet.writeBuffer(this.authPluginData2);
  packet.writeInt8(0);
  packet.writeString('mysql_native_password');
  packet.writeInt8(0);
  return packet;
};

module.exports = Handshake;

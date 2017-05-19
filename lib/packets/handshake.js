var Buffer = require('safe-buffer').Buffer;
var Packet = require('../packets/packet');

function Handshake(args) {
  this.protocolVersion = args.protocolVersion;
  this.serverVersion = args.serverVersion;
  this.capabilityFlags = args.capabilityFlags;
  this.connectionId = args.connectionId;
  this.authPluginData1 = args.authPluginData1;
  this.authPluginData2 = args.authPluginData2;
  this.characterSet = args.characterSet;
  this.statusFlags = args.statusFlags;
}

Handshake.fromPacket = function(packet) {
  var args = {};
  args.protocolVersion = packet.readInt8();
  args.serverVersion = packet.readNullTerminatedString('cesu8');
  args.connectionId = packet.readInt32();
  args.authPluginData1 = packet.readBuffer(8);
  packet.skip(1);
  var capabilityFlagsBuffer = Buffer.allocUnsafe(4);
  capabilityFlagsBuffer[0] = packet.readInt8();
  capabilityFlagsBuffer[1] = packet.readInt8();
  if (packet.haveMoreData()) {
    args.characterSet = packet.readInt8();
    args.statusFlags = packet.readInt16();
    // upper 2 bytes
    capabilityFlagsBuffer[2] = packet.readInt8();
    capabilityFlagsBuffer[3] = packet.readInt8();
    args.capabilityFlags = capabilityFlagsBuffer.readUInt32LE(0);
    args.authPluginDataLength = packet.readInt8();
    packet.skip(10);
  } else {
    args.capabilityFlags = capabilityFlagsBuffer.readUInt16LE(0);
  }
  // var len = Math.max(12, args.authPluginDataLength - 8);
  args.authPluginData2 = packet.readBuffer(12);

  // TODO: expose combined authPluginData1 + authPluginData2 as authPluginData
  //
  // TODO
  // if capabilities & CLIENT_PLUGIN_AUTH {
  //   string[NUL]    auth-plugin name
  //  }
  return new Handshake(args);
};

Handshake.prototype.setScrambleData = function(cb) {
  var self = this;
  require('crypto').randomBytes(20, function(err, data) {
    if (err) {
      cb(err);
      return;
    }
    self.authPluginData1 = data.slice(0, 8);
    self.authPluginData2 = data.slice(8, 20);
    cb();
  });
};

Handshake.prototype.toPacket = function(sequenceId) {
  var buffer, packet;
  var length = 68 + Buffer.byteLength(this.serverVersion, 'utf8');
  buffer = Buffer.alloc(length + 4, 0); // zero fill, 10 bytes filler later needs to contain zeros
  packet = new Packet(sequenceId, buffer, 0, length + 4);
  packet.offset = 4;
  packet.writeInt8(this.protocolVersion);
  packet.writeString(this.serverVersion, 'cesu8');
  packet.writeInt8(0);
  packet.writeInt32(this.connectionId);
  packet.writeBuffer(this.authPluginData1);
  packet.writeInt8(0);
  var capabilityFlagsBuffer = Buffer.allocUnsafe(4);
  capabilityFlagsBuffer.writeUInt32LE(this.capabilityFlags, 0);
  packet.writeBuffer(capabilityFlagsBuffer.slice(0, 2));
  packet.writeInt8(this.characterSet);
  packet.writeInt16(this.statusFlags);
  packet.writeBuffer(capabilityFlagsBuffer.slice(2, 4));
  packet.writeInt8(21); // authPluginDataLength
  packet.skip(10);
  packet.writeBuffer(this.authPluginData2);
  packet.writeInt8(0);
  packet.writeString('mysql_native_password', 'latin1');
  packet.writeInt8(0);
  return packet;
};

module.exports = Handshake;

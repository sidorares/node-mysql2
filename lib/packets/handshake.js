function Handshake(packet)
{
  this.version         = packet.readInt8();
  this.serverVersion   = packet.readNullTerminatedString();
  this.connectionId    = packet.readInt32();
  this.authPluginData1 = packet.readBuffer(8);
  packet.skip(1);
  this.capabilityFlags = packet.readInt16();
  if (packet.haveMoreData()) {
    this.characterSet = packet.readInt8();
    this.statusFlags  = packet.readInt16();
    // upper 2 bytes
    this.capabilityFlags += packet.readInt16() << 16;
    this.authPluginDataLength = packet.readInt8();
    packet.skip(10);
  }
  //var len = Math.max(12, this.authPluginDataLength - 8);
  this.authPluginData2 = packet.readBuffer(12);
}

module.exports = Handshake;

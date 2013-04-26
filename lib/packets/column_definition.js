var Packet = require('../packets/packet');

function ColumnDefinition(packet)
{
  this.catalog  = packet.readLengthCodedString();
  this.schema   = packet.readLengthCodedString();
  this.table    = packet.readLengthCodedString();
  this.orgTable = packet.readLengthCodedString();
  this.name     = packet.readLengthCodedString();
  this.orgName  = packet.readLengthCodedString();
  packet.skip(1); //  length of the following fields (always 0x0c)
  this.characterSet = packet.readInt16();
  this.columnLength = packet.readInt32();
  this.columnType   = packet.readInt8();
  this.flags        = packet.readInt16();
  this.decimals     = packet.readInt8();
}

// TODO: toPacket

module.exports = ColumnDefinition;

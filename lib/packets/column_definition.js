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

ColumnDefinition.toPacket = function(column, sequenceId)
{
  var length = 0;
  var fields = 'catalog schema table orgTable name orgName'.split(' ');
  function addFieldLength(name) {
    var str = column[name];
    length +=Packet.lengthCodedNumberLength(str);
    length += str.length;
  }
  fields.forEach(addFieldLength);
  length += 13;
  var buffer = new Buffer(length);
  function writeField(name) {
    packet.writeLengthCodedString(column[name]);
  }
  var packet = new Packet(sequenceId, buffer);
  packet.offset = 4;
  fields.forEach(writeField);
  packet.writeInt8 (0x0c);
  packet.writeInt16(column.characterSet);
  packet.writeInt32(column.columnLength);
  packet.writeInt8 (column.columnType);
  packet.writeInt16(column.flags);
  packet.writeInt8 (column.decimals);
  return packet;
};

module.exports = ColumnDefinition;

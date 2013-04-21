//var constants = require('../constants');
var Packet = require('../packets/packet');

function TextRow(columns)
{
  this.columns = columns || [];
}

TextRow.fromPacket = function(packet) {
  //packet.reset(); // set offset to starting point?
  var columns = [];
  while(packet.haveMoreData()) {
    columns.push(packet.readLengthCodedString());
  }
  return new TextRow(columns);
};

TextRow.prototype.toPacket = function(sequenceId) {
  var buffer, i, packet, column;
  var length = 0;
  for(i=0; i < this.columns.length; ++i) {
    column = this.columns[i];
    length += Packet.lengthCodedNumberLength(column);
    length += column.length;
  }
  buffer = new Buffer(length+4);
  packet = new Packet(sequenceId, buffer);
  packet.offset = 4;
  for(i=0; i < this.columns.length; ++i) {
    packet.writeLengthCodedString(this.columns[i]);
  }
  return packet;
};

module.exports = TextRow;

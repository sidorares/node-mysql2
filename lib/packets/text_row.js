//var constants = require('../constants');
var Packet = require('../packets/packet');

function TextRow(columns)
{
  this.columns = columns || [];
}

TextRow.fromPacket = function(packet) {
  packet.offset = 0;
  var columns = [];
  console.log(packet, packet.payload.length);
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
    console.log('qqqqqq', Packet.lengthCodedNumberLength(column));
    length += Packet.lengthCodedNumberLength(column);
    length += column.length;
  }
  console.log('length:', length);
  buffer = new Buffer(length+4);
  packet = new Packet(sequenceId, buffer);
  packet.offset = 4;
  for(i=0; i < this.columns.length; ++i) {
    packet.writeLengthCodedString(this.columns[i]);
  }
  return packet;
};

module.exports = TextRow;

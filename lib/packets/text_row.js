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

TextRow.toPacket = function(column) {
  var sequenceId = 0; // TODO remove, this is calculated now in connecton
  var buffer, packet;
  var length = 0;
  column.forEach(function(val) {
	if (val === null || typeof(val) == 'undefined') return ++length;
    var str = val.toString(10);
    length += Packet.lengthCodedNumberLength(str);
    length += str.length;
  });
  buffer = new Buffer(length+4);
  packet = new Packet(sequenceId, buffer, 0, length+4);
  packet.offset = 4;
  column.forEach(function(val) {
    if (val === null) return packet.writeNull();
    if (typeof val == 'undefined') return packet.writeInt8(0);
    packet.writeLengthCodedString(val.toString(10));
  });
  return packet;
};

module.exports = TextRow;

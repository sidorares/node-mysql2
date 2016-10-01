var Buffer = require('safe-buffer').Buffer;
var Packet = require('../packets/packet');
var CharsetToEncoding = require('../constants/charset_encodings.js');

function TextRow (columns)
{
  this.columns = columns || [];
}

TextRow.fromPacket = function (packet) {
  // packet.reset(); // set offset to starting point?
  var columns = [];
  while (packet.haveMoreData()) {
    columns.push(packet.readLengthCodedString());
  }
  return new TextRow(columns);
};

TextRow.toPacket = function (columns, encoding) {
  var sequenceId = 0; // TODO remove, this is calculated now in connecton
  var buffer, packet;
  var length = 0;
  columns.forEach(function (val) {
    if (val === null || typeof (val) == 'undefined') {
      ++length;
      return;
    }
    length += Packet.lengthCodedStringLength(val.toString(10), encoding);
  });

  buffer = Buffer.allocUnsafe(length + 4);
  packet = new Packet(sequenceId, buffer, 0, length + 4);
  packet.offset = 4;
  columns.forEach(function (val) {
    if (val === null) {
      packet.writeNull();
      return;
    }
    if (typeof val == 'undefined') {
      packet.writeInt8(0);
      return;
    }
    packet.writeLengthCodedString(val.toString(10), encoding);
  });
  return packet;
};

module.exports = TextRow;

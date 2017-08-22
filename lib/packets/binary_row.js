var Types = require('../constants/types');
var Packet = require('../packets/packet');

function BinaryRow(columns) {
  this.columns = columns || [];
}

var binaryReader = new Array(256);

// TODO: replace with constants.MYSQL_TYPE_*
binaryReader[Types.DECIMAL] = Packet.prototype.readLengthCodedString;
binaryReader[1] = Packet.prototype.readInt8; // tiny
binaryReader[2] = Packet.prototype.readInt16; // short
binaryReader[3] = Packet.prototype.readInt32; // long
binaryReader[4] = Packet.prototype.readFloat; // float
binaryReader[5] = Packet.prototype.readDouble; // double
binaryReader[6] = Packet.prototype.assertInvalid; // null, should be skipped vie null bitmap
binaryReader[7] = Packet.prototype.readTimestamp; // timestamp, http://dev.mysql.com/doc/internals/en/prepared-statements.html#packet-ProtocolBinary::MYSQL_TYPE_TIMESTAMP
binaryReader[8] = Packet.prototype.readInt64; // long long
binaryReader[9] = Packet.prototype.readInt32; // int24
binaryReader[10] = Packet.prototype.readTimestamp; // date
binaryReader[11] = Packet.prototype.readTime; // time, http://dev.mysql.com/doc/internals/en/prepared-statements.html#packet-ProtocolBinary::MYSQL_TYPE_TIME
binaryReader[12] = Packet.prototype.readDateTime; // datetime, http://dev.mysql.com/doc/internals/en/prepared-statements.html#packet-ProtocolBinary::MYSQL_TYPE_DATETIME
binaryReader[13] = Packet.prototype.readInt16; // year
binaryReader[Types.VAR_STRING] = Packet.prototype.readLengthCodedString; // var string
// TODO: complete list of types...

BinaryRow.fromPacket = function(fields, packet) {
  var columns = new Array(fields.length);
  var ok = packet.readInt8(); // TODO check it's 0
  var nullBitmapLength = Math.floor((fields.length + 7 + 2) / 8);
  // TODO: read and interpret null bitmap
  packet.skip(nullBitmapLength);
  for (var i = 0; i < columns.length; ++i) {
    columns[i] = binaryReader[fields[i].columnType].apply(packet);
  }
  return new BinaryRow(columns);
};

BinaryRow.prototype.toPacket = function(sequenceId) {
  throw 'Not implemented';
};

module.exports = BinaryRow;

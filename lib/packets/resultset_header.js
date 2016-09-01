// TODO: rename to OK packet

var Buffer = require('safe-buffer').Buffer;
var Packet = require('../packets/packet');

function ResultSetHeader (packet, bigNumberStrings, encoding)
{
  if (packet.buffer[packet.offset] !== 0) {
    this.fieldCount = packet.readLengthCodedNumber();
  } else {
    this.fieldCount = packet.readInt8(); // skip OK byte
    this.affectedRows = packet.readLengthCodedNumber(bigNumberStrings);
    this.insertId = packet.readLengthCodedNumberSigned(bigNumberStrings);
    this.serverStatus = packet.readInt16();
    this.warningStatus = packet.readInt16();
  }
  if (this.fieldCount === null) {
    this.infileName = packet.readString(undefined, encoding);
  }

  // snippet from mysql-native:
  // res.affected_rows = this.lcnum();
  // res.insert_id = this.lcnum();
  // res.server_status = this.num(2);
  // res.warning_count = this.num(2);

  // TODO: extra
}

// TODO: should be consistent instance member, but it's just easier here to have just function
ResultSetHeader.toPacket = function (fieldCount, insertId, sequenceId) {
  var length = 4 + Packet.lengthCodedNumberLength(fieldCount);
  if (typeof (insertId) != 'undefined') {
    length += Packet.lengthCodedNumberLength(insertId);
  }
  var buffer = Buffer.allocUnsafe(length);
  var packet = new Packet(0, buffer, 0, length);
  packet.offset = 4;
  packet.writeLengthCodedNumber(fieldCount);
  if (typeof (insertId) != 'undefined') {
    packet.writeLengthCodedNumber(insertId);
  }
  return packet;
};

module.exports = ResultSetHeader;

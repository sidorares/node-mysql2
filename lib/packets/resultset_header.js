// TODO: rename to OK packet

var Packet = require('../packets/packet');

function ResultSetHeader(packet)
{
  this.fieldCount = packet.readLengthCodedNumber();
  if (packet.haveMoreData())
    this.insertId   = packet.readLengthCodedNumber();

  // snippet from mysql-native:
  // res.affected_rows = this.lcnum();
  // res.insert_id = this.lcnum();
  // res.server_status = this.num(2);
  // res.warning_count = this.num(2);

  // TODO: extra
}

// TODO: should be consistent instance member, but it's just easier here to have just function
ResultSetHeader.toPacket = function(fieldCount, insertId, sequenceId) {
  var length = 4 + Packet.lengthCodedNumberLength(fieldCount);
  if (typeof(insertId) != 'undefined')
    length += Packet.lengthCodedNumberLength(insertId);
  var buffer = new Buffer(length);
  var packet = new Packet(0, buffer);
  packet.offset = 4;
  packet.writeLengthCodedNumber(fieldCount);
  if (typeof(insertId) != 'undefined')
    packet.writeLengthCodedNumber(insertId);
  return packet;
};

module.exports = ResultSetHeader;

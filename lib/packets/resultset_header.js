var Packet = require('../packets/packet');

function ResultSetHeader(packet)
{
  this.fieldCount = packet.readLengthCodedNumber();
  // is this correct?
  if (packet.haveMoreData())
    this.insertId   = packet.readLengthCodedNumber();

  // snippet from mysql-native:
  // res.affected_rows = this.lcnum();
  // res.insert_id = this.lcnum();
  // res.server_status = this.num(2);
  // res.warning_count = this.num(2);

  // TODO: extra
}

// TODO: toPacket

module.exports = ResultSetHeader;

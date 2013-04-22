//var constants = require('../constants');
var Packet = require('../packets/packet');

function Execute(id, parameters)
{
  this.id = id;
  this.parameters = parameters;
}

Execute.prototype.toPacket = function()
{
  // 0 + 4 - length, seqId
  // 4 + 1 - COM_EXECUTE
  // 5 + 4 - stmtId
  // 9 + 1 - flags
  // 10 + 4 - iteration-count (always 1)
  var length = 14;
  // TODO: parameters
  // TODO: parameters bound

  var buffer = new Buffer(length);
  var packet = new Packet(0, buffer);
  packet.offset = 4;
  packet.writeInt8(0x17); // TODO: constants.COM_EXECUTE
  packet.writeInt32(this.id);
  // flags:
  // 0x00 CURSOR_TYPE_NO_CURSOR
  // 0x01 CURSOR_TYPE_READ_ONLY
  // 0x02 CURSOR_TYPE_FOR_UPDATE
  // 0x04 CURSOR_TYPE_SCROLLABLE
  packet.writeInt8(0);  // flags
  packet.writeInt32(1); // iteration-count, always 1
  return packet;
};

module.exports = Execute;

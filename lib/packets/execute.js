var CursorType  = require('../constants/cursor');
var Packet      = require('../packets/packet');
var CommandCode = require('../constants/commands');

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
  packet.writeInt8(CommandCode.EXECUTE);
  packet.writeInt32(this.id);
  packet.writeInt8(CursorType.NO_CURSOR);  // flags
  packet.writeInt32(1); // iteration-count, always 1
  return packet;
};

module.exports = Execute;

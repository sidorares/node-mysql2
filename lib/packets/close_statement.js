var Packet = require('../packets/packet');
var CommandCodes = require('../constants/commands');

function CloseStatement(id) {
  this.id = id;
}

// note: no response sent back
CloseStatement.prototype.toPacket = function() {
  var packet = new Packet(0, Buffer.allocUnsafe(9), 0, 9);
  packet.offset = 4;
  packet.writeInt8(CommandCodes.STMT_CLOSE);
  packet.writeInt32(this.id);
  return packet;
};

module.exports = CloseStatement;

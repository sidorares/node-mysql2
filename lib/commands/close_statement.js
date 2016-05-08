var util = require('util');

var Command = require('./command');
var Packets = require('../packets/index.js');

function CloseStatement (id)
{
  Command.call(this);
  this.id = id;
}
util.inherits(CloseStatement, Command);

CloseStatement.prototype.start = function (packet, connection) {
  connection.writePacket(new Packets.CloseStatement(this.id).toPacket(1));
  return null;
};

module.exports = CloseStatement;

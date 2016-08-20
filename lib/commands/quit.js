var util = require('util');
var Buffer = require('safe-buffer').Buffer;

var Command = require('./command.js');
var CommandCode = require('../constants/commands.js');
var Packet = require('../packets/packet.js');

function Quit (callback)
{
  this.done = callback;
  Command.call(this);
}
util.inherits(Quit, Command);

Quit.prototype.start = function (packet, connection) {
  connection._closing = true;
  var quit = new Packet(0, Buffer.from([1, 0, 0, 0, CommandCode.QUIT]), 0, 5);
  if (this.done) {
    this.done();
  }
  connection.writePacket(quit);
  return null;
};

module.exports = Quit;

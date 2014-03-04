var Command  = require('./command');
var util    = require('util');
var CommandCode = require('../constants/commands');
var Packets = require('../packets');

function RegisterSlave(opts, callback)
{
  Command.call(this);
  this.onResult = callback;
  this.opts = opts;
}
util.inherits(RegisterSlave, Command);

RegisterSlave.prototype.start = function(packet, connection) {
  var packet = new Packets.RegisterSlave(this.opts);
  connection.writePacket(packet.toPacket(1));
  return RegisterSlave.prototype.registerResponse;
};

RegisterSlave.prototype.registerResponse = function(packet) {
  if (this.onResult)
    process.nextTick(this.onResult.bind(this));
  return null;
};

module.exports = RegisterSlave;
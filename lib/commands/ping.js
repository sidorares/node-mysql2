var util = require('util');
var Buffer = require('safe-buffer').Buffer;

var Command = require('./command');
var CommandCode = require('../constants/commands');
var Packet = require('../packets/packet');

// TODO: time statistics?
// usefull for queue size and network latency monitoring
// store created,sent,reply timestamps

function Ping(callback) {
  Command.call(this);
  this.onResult = callback;
}
util.inherits(Ping, Command);

Ping.prototype.start = function(packet, connection) {
  var ping = new Packet(0, Buffer.from([1, 0, 0, 0, CommandCode.PING]), 0, 5);
  connection.writePacket(ping);
  return Ping.prototype.pingResponse;
};

Ping.prototype.pingResponse = function(packet) {
  // TODO: check it's OK packet. error check already done in caller
  if (this.onResult) {
    process.nextTick(this.onResult.bind(this));
  }
  return null;
};

module.exports = Ping;

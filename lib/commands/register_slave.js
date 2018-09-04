const Command = require('./command');
const Packets = require('../packets');

class RegisterSlave extends Command {
  constructor(opts, callback) {
    super();
    this.onResult = callback;
    this.opts = opts;
  }

  start(packet, connection) {
    var packet = new Packets.RegisterSlave(this.opts);
    connection.writePacket(packet.toPacket(1));
    return RegisterSlave.prototype.registerResponse;
  }

  registerResponse(packet) {
    if (this.onResult) {
      process.nextTick(this.onResult.bind(this));
    }
    return null;
  }
}

module.exports = RegisterSlave;

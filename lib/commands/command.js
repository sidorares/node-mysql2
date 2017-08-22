var EventEmitter = require('events').EventEmitter;
var util = require('util');

function Command() {
  EventEmitter.call(this);
  this.next = null;
}
util.inherits(Command, EventEmitter);

// slow. debug only
Command.prototype.stateName = function() {
  var state = this.next;
  for (var i in this) {
    if (this[i] == state && i != 'next') {
      return i;
    }
  }
  return 'unknown name';
};

Command.prototype.execute = function(packet, connection) {
  if (!this.next) {
    this.next = this.start;
    connection._resetSequenceId();
  }

  if (packet && packet.isError()) {
    var err = packet.asError(connection.clientEncoding);
    if (this.onResult) {
      this.onResult(err);
      this.emit('end');
    } else {
      this.emit('error', err);
      this.emit('end');
    }
    return true;
  }

  // TODO: don't return anything from execute, it's ugly and error-prone. Listen for 'end' event in connection
  this.next = this.next(packet, connection);
  if (this.next) {
    return false;
  } else {
    this.emit('end');
    return true;
  }
};

module.exports = Command;

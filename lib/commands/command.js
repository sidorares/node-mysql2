var EventEmitter = require('events').EventEmitter;
var util = require('util');

function Command () {
  EventEmitter.call(this);
  this.next = null;
}
util.inherits(Command, EventEmitter);

// slow. debug only
Command.prototype.stateName = function () {
  var state = this.next;
  for (var i in this) {
    if (this[i] == state && i != 'next') {
      return i;
    }
  }
  return 'unknown name';
};

Command.prototype.execute = function (packet, connection) {
  // TODO: hack
  if (!this.next) {
    this.next = this.start;
  }

  if (packet && packet.isError()) {
    var err = packet.asError(connection.clientEncoding);
    if (this.onResult) {
      this.onResult(err);
    } else {
      this.emit('error', err);
    }
    return true;
  }

  // TODO: don't return anything from execute, it's ugly and error-prone. Listen for 'end' event in connection
  try {
    this.next = this.next(packet, connection);
  } catch (err) {
    this.emit('error', err);
    this.emit('end');
    return false;
  }

  if (this.next) {
    return false;
  } else {
    this.emit('end');
    return true;
  }
};

module.exports = Command;

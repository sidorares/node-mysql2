var Readable = require('stream').Readable;

// copy-paste from https://github.com/mysqljs/mysql/blob/master/lib/protocol/sequences/Query.js
module.exports = function(command, connectionStream) {
  command.stream = function(options) {
    var stream;

    options = options || {};
    options.objectMode = true;
    (stream = new Readable(options)), (stream._read = function() {
      connectionStream.resume();
    });

    this.on('result', function(row, i) {
      if (!stream.push(row)) {
        connectionStream.pause();
      }
      stream.emit('result', row, i); // replicate old emitter
    });

    this.on('error', function(err) {
      stream.emit('error', err); // Pass on any errors
    });

    this.on('end', function() {
      stream.push(null); // pushing null, indicating EOF
    });

    this.on('fields', function(fields, i) {
      stream.emit('fields', fields, i); // replicate old emitter
    });

    return stream;
  };
};

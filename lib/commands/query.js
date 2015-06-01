var fs           = require('fs');
var util         = require('util');

var Readable     = require('readable-stream');

var Command  = require('./command.js');
var Packets  = require('../packets/index.js');
var compileParser = require('../compile_text_parser.js');
var ServerStatus = require('../constants/server_status.js');

var EmptyPacket = new Packets.Packet(0, new Buffer(4), 0, 4);

function Query(sql, options, callback)
{
  Command.call(this);
  this.query = sql;
  // node-mysql compatibility: query.sql as alias to query.query #121
  this.sql = this.query;
  this.options = options;
  this.onResult = callback;
  this._fieldCount = 0;
  this._rowParser  = null;
  this._fields     = [];
  this._rows       = [];
  this._receivedFieldsCount = 0;
  this._resultIndex = 0;
  this._localStream = null;
  this._streamFactory = options.infileStreamFactory;
  this._connection = null;
}
util.inherits(Query, Command);

Query.prototype.start = function(packet, connection) {
  if (connection.config.debug) {
    console.log('        Sending query command: %s', this.query);
  }
  this._connection = connection;
  var cmdPacket = new Packets.Query(this.query);
  connection.writePacket(cmdPacket.toPacket(1));
  return Query.prototype.resultsetHeader;
};

Query.prototype.done = function() {
  var self = this;
  if (this.onResult) {
    var rows, fields;
    if (this._resultIndex === 0) {
      rows = this._rows[0];
      fields = this._fields[0];
    } else {
      rows = this._rows;
      fields = this._fields;
    }
    if (fields) {
      process.nextTick(function() {
        self.onResult(null, rows, fields, self._resultIndex + 1);
      });
    } else {
      process.nextTick(function() {
        self.onResult(null, rows, void(0), self._resultIndex + 1);
      });
    }
  }
  return null;
};

Query.prototype.doneInsert = function(rs) {
  if (this._localStreamError) {
    if (this.onResult) {
      this.onResult(this._localStreamError, rs);
    } else {
      this.emit('error', this._localStreamError);
    }
    return null;
  }
  this._rows.push(rs);
  this._fields.push(void(0));
  this.emit('result', rs, this._resultIndex);
  this.emit('fields', void(0), this._resultIndex);
  if (rs.serverStatus & ServerStatus.SERVER_MORE_RESULTS_EXISTS) {
    this._resultIndex++;
    return this.resultsetHeader;
  }
  return this.done();
};

Query.prototype.resultsetHeader = function(packet, connection) {
  var rs = new Packets.ResultSetHeader(packet, connection.config.bigNumberStrings);
  this._fieldCount = rs.fieldCount;
  if (connection.config.debug) {
    console.log('        Resultset header received, expecting ' + rs.fieldCount + ' column definition packets');
  }
  if (this._fieldCount === 0) {
    return this.doneInsert(rs);
  }
  if (this._fieldCount === null) {
    this._localStream = this._findOrCreateReadStream(rs.infileName);
    // start streaming, after last packet expect OK
    this._streamLocalInfile(connection);
    return this.infileOk;
  }

  this._receivedFieldsCount = 0;
  this._rows.push([]);
  this._fields.push([]);
  return this.readField;
};

// some code taken from https://github.com/felixge/node-mysql/pull/668
Query.prototype._findOrCreateReadStream = function(path) {
  if (this._streamFactory)
    return this._streamFactory(path);
  return fs.createReadStream(path, {
    'flag': 'r',
    'encoding': null,
    'autoClose': true
  });
};

Query.prototype._streamLocalInfile = function(connection) {
  var command = this;
  connection.stream.on('pause', function() {
    command._localStream.pause();
  });
  connection.stream.on('drain', function() {
    command._localStream.resume();
  });
  this._localStream.on('data', function (data) {
    var dataWithHeader = new Buffer(data.length + 4);
    data.copy(dataWithHeader, 4);
    connection.writePacket(new Packets.Packet(0, dataWithHeader, 0, dataWithHeader.length));
  });
  this._localStream.on('end', function (data) {
    connection.writePacket(EmptyPacket);
  });
  this._localStream.on('error', function(err) {
    command._localStreamError = err;
    command._localStream.emit('end');
  });
}

Query.prototype.readField = function(packet, connection) {

  this._receivedFieldsCount++;

  // Often there is much more data in the column definition than in the row itself
  // If you set manually _fields[0] to array of ColumnDefinition's (from previous call)
  // you can 'cache' result of parsing. Field packets still received, but ignored in that case
  // this is the reason _receivedFieldsCount exist (otherwise we could just use current length of fields array)

  if (this._fields[this._resultIndex].length != this._fieldCount) {
    var field = new Packets.ColumnDefinition(packet);
    this._fields[this._resultIndex].push(field);
    if (connection.config.debug) {
      console.log('        Column definition:');
      console.log('          name: ' + field.name);
      console.log('          type: ' + field.columnType);
      console.log('         flags: ' + field.flags);
    }
  }

  // last field received
  if (this._receivedFieldsCount == this._fieldCount) {
    var fields = this._fields[this._resultIndex];
    this.emit('fields', fields, this._resultIndex);
    var parserKey = connection.keyFromFields(fields, this.options);
    this._rowParser = connection.textProtocolParsers[parserKey];
    if (!this._rowParser) {
      this._rowParser = compileParser(fields, this.options, connection.config);
      connection.textProtocolParsers[parserKey] = this.rowParser;
    }
    return Query.prototype.fieldsEOF;
  }
  return Query.prototype.readField;
};

Query.prototype.fieldsEOF = function(packet, connection) {
  // check EOF
  if (!packet.isEOF())
    return connection.protocolError("Expected EOF packet");
  return this.row;
};

Query.prototype.row = function(packet)
{
  if (packet.isEOF()) {
    var status = packet.eofStatusFlags();
    var moreResults = status & ServerStatus.SERVER_MORE_RESULTS_EXISTS;
    if (moreResults) {
      this._resultIndex++;
      return Query.prototype.resultsetHeader;
    }
    return this.done();
  }

  var row = new this._rowParser(packet);
  if (this.onResult)
    this._rows[this._resultIndex].push(row);
  else
    this.emit('result', row, this._resultIndex);

  return Query.prototype.row;
};

Query.prototype.infileOk = function(packet, connection) {
  var rs = new Packets.ResultSetHeader(packet, connection.config.bigNumberStrings);
  return this.doneInsert(rs);
};

Query.prototype.stream = function(options) {
  var self = this,
      stream;

  options = options || {};
  options.objectMode = true;
  stream = new Readable(options);

  stream._read = function() {
    self._connection && self._connection.resume();
  };

  this.on('result',function(row,i) {
    if (!stream.push(row)) self._connection.pause();
    stream.emit('result',row,i);  // replicate old emitter
  });

  this.on('error',function(err) {
    stream.emit('error',err);  // Pass on any errors
  });

  this.on('end', function() {
    stream.emit('close');  // notify readers that query has completed
    stream.push(null);  // pushing null, indicating EOF
  });

  this.on('fields',function(fields,i) {
    stream.emit('fields',fields,i);  // replicate old emitter
  });

  return stream;
};

module.exports = Query;

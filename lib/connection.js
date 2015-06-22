var net          = require('net');
var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var Queue        = require('double-ended-queue');

var PacketParser = require('./packet_parser.js');
var Packet       = require('./packets/packet.js');
var Packets      = require('./packets/index.js');
var Commands     = require('./commands/index.js');
var SqlString    = require('./sql_string.js');
var ConnectionConfig = require('./connection_config.js');

var _connectionId = 0;
var noop = function() {};

function Connection(opts)
{
  EventEmitter.call(this);
  this.config = opts.config;

  // TODO: fill defaults
  // if no params, connect to /var/lib/mysql/mysql.sock ( /tmp/mysql.sock on OSX )
  // if host is given, connect to host:3306

  // TODO: use `/usr/local/mysql/bin/mysql_config --socket` output? as default socketPath
  // if there is no host/port and no socketPath parameters?

  if (!opts.config.stream) {
    if (opts.config.socketPath)
      this.stream = net.connect(opts.config.socketPath);
    else
      this.stream = net.connect(opts.config.port, opts.config.host);
  } else {
    // if stream is a function, treat it as "stream agent / factory"
    if (typeof opts.config.stream == 'function')
      this.stream = opts.config.stream(opts);
    else
      this.stream = opts.config.stream;
  }
  this._internalId = _connectionId++;

  this._commands = new Queue();
  this._command = null;

  this._paused = false;
  this._paused_packets = new Queue();

  this._statements = {};

  // TODO: make it lru cache
  // https://github.com/mercadolibre/node-simple-lru-cache
  // or https://github.com/rsms/js-lru
  // or https://github.com/monsur/jscache
  // or https://github.com/isaacs/node-lru-cache
  //
  // key is field.name + ':' + field.columnType + ':' field.flags + '/'
  this.textProtocolParsers = {};

  // TODO: not sure if cache should be separate (same key as with textProtocolParsers)
  // or part of prepared statements cache (key is sql query)
  this.binaryProtocolParsers = {};

  this.serverCapabilityFlags = 0;
  this.authorized = false;

  var connection = this;
  this.sequenceId = 0;

  this.threadId = null;
  this._handshakePacket = null;

  this.stream.on('error', function(err) {
    connection.emit('error', err);
  });

  // big TODO: benchmark if it all worth using 'ondata' and onPacket callbacks directly
  // compositing streams would be much more easier.
  // also, look for existing length-prefixed streams to reuse instead of packet_parser
  //  https://github.com/squaremo/node-spb - currently only fixed 4 byte prefix
  //  ...?

  // see https://gist.github.com/khoomeister/4985691#use-that-instead-of-bind
  this.packetParser = new PacketParser(function(p) { connection.handlePacket(p); });

  // TODO: this code used to be an optimized version of handler
  // DOES NOT WORK IN NODE 11
  // TODO: measure if we actually get something here
  // if yes, re-enable for node 10
  //if (this.stream instanceof net.Stream) {
  //  this.stream.ondata = function(data, start, end) {
  //    connection.packetParser.execute(data, start, end);
  //  };
  //} else {
    this.stream.on('data', function(data) {
      connection.packetParser.execute(data);
    });
  //}
  this._protocolError = null;
  this.stream.on('end', function() {
    // we need to set this flag everywhere where we want connection to close
    if (connection._closing)
      return;

    // TODO: move to protocolError()
    if (!connection._protocolError) // no particular error message before disconnect
      connection._protocolError = 'PROTOCOL_CONNECTION_LOST';
    var err = new Error('Connection lost: The server closed the connection.');
    err.fatal = true;
    err.code = connection._protocolError;

    var command;
    if (connection._command && connection._command.onResult)
      connection._command.onResult(err);
    while (command = connection._commands.shift()) {
      if (command.onResult)
         command.onResult(err);
    }

    connection.emit('error', err);

  });
  var handshakeCommand;
  if (!this.config.isServer) {
    handshakeCommand = new Commands.ClientHandshake(this.config.clientFlags);
    handshakeCommand.on('error', function(e) { connection.emit('error', e); });
    handshakeCommand.on('end', function() {
      connection._handshakePacket = handshakeCommand.handshake;
      connection.threadId = handshakeCommand.handshake.connectionId;
    });
    this.addCommand(handshakeCommand);
  }
}
util.inherits(Connection, EventEmitter);

Connection.prototype.write = function(buffer) {
  this.stream.write(buffer);
};

// TODO: replace function in runtime instead of having if() here
// Needs benchmark.
Connection.prototype.writePacket = function(packet) {
  packet.writeHeader(this.sequenceId);
  if (this.config.debug) {
    console.log(this._internalId + ' ' + this.connectionId + ' <== ' + this._command._commandName + '#' + this._command.stateName() + '(' + [this.sequenceId, packet._name, packet.length()].join(',') + ')');
  }
  this.sequenceId++;
  if (this.sequenceId == 256)
    this.sequenceId = 0
  if (!this.config.compress || !this.authorized) {
    this.write(packet.buffer);
  } else {
    var packetLen = packet.length();
    var compressHeader = new Buffer(7);

    // TODO: currently all outgoing packets are sent uncompressed (header + deflated length=0 as uncompressed flag)
    // Need to implement deflation of outgoing packet. Also need to decide when not to compress small packets
    // http://dev.mysql.com/doc/internals/en/compression.html#uncompressed-payload suggest not to compress packets less than 50 bytes

    // Write uncompressed packet
    compressHeader.fill(0);
    compressHeader.writeUInt8(packetLen & 0xff, 0);
    compressHeader.writeUInt16LE(packetLen >> 8, 1);
    this.write(compressHeader);
    this.write(packet.buffer);
  }
};

Connection.prototype.startTLS = function(onSecure) {
  if (this.config.debug) {
    console.log('Upgrading connection to TLS');
  }
  var connection = this;
  var crypto = require('crypto');
  var tls = require('tls');
  var config = this.config;
  var stream = this.stream;

  var credentials = crypto.createCredentials({
    key: config.ssl.key,
    cert: config.ssl.cert,
    passphrase: config.ssl.passphrase,
    ca: config.ssl.ca
  });
  var securePair = tls.createSecurePair(credentials, false);
  if (stream.ondata)
    stream.ondata = null;
  stream.removeAllListeners('data');
  stream.pipe(securePair.encrypted);
  securePair.encrypted.pipe(stream);
  securePair.cleartext.on('data', function(data) {
    connection.packetParser.execute(data);
  });
  connection.write = function(buffer) {
    securePair.cleartext.write(buffer);
  };
  securePair.on('secure', onSecure);
};

// TODO: this does not work if uncompressed packet is split by compressed
// packet boundary.
// My assumption about compressedPacket to contain one or more complete
// compressed packets was wrong. It can wrap any chunk of data.
// This will be rmoved in favor of connection.startInflate
// currently Handshake command overwrites connection.handlePacket with handleCompressedPacket
// before expecting first compressed packet
var zlib = require('zlib');
Connection.prototype.handleCompressedPacket = function(packet) {
  var connection = this;
  var inflatedLength = packet.readInt24();
  if (inflatedLength !== 0) {
    var compressedBody = packet.readBuffer(packet.length() - 3);
    zlib.inflate(compressedBody, function(err, packets) {
      if (err)
        return connection.emit('error', err);
      var offset = packets.offset;
      var end = offset + packets.length;
      var buffer = packets.parent;
      var len = 0;
      var id = 0;
      // single compressed packet can contain multiple uncompressed
      while (offset < end) {
        len = buffer.readUInt16LE(offset) + (buffer[offset+2] << 16);
        id  = buffer[offset+3];
        connection.handlePacket(new Packet(id, buffer, offset + 4, offset + 4 + len));
        offset += 4 + len;
      }
    });
  } else {
    inflatedLength = packet.readInt24();
    var sequenceId = packet.readInt8();
    connection.handlePacket(new Packet(sequenceId, packet.buffer, packet.offset, packet.offset + inflatedLength));
  }
};

// TODO: consider using @creationix simple-streams
// https://gist.github.com/creationix/5498108
// https://github.com/creationix/min-stream-uv
// https://github.com/creationix/min-stream-helpers


// TODO: try with Stream2 streams
//
// changes stream -> packetParser to
// stream -> compressedPacketParser -> inflateStream -> packetParser
// note that in the caseof ssl this should become
// stream -> securePair.encrypted -> securePair.cleartext -> compressedPacketParser -> inflateStream -> packetParser
Connection.prototype.startInflate = function() {
  var connection = this;
  var zlib = require('zlib');
  var inflateStream = zlib.createInflate();
  var uncompressedPacketParser = connection.packetParser;
  connection.packetParser = new PacketParser(function(packet) {
    var inflatedLength = packet.readInt24();
    if (inflatedLength !== 0) {
      inflateStream.write(packet.readBuffer(packet.length() - 3));
    } else {
      uncompressedPacketParser.execute(packet.buffer, packet.offset, packet.end);
    }
  });
  inflateStream.on('data', function(buff) {
    uncompressedPacketParser.execute(buff.parent, buff.offset, buff.offset + buff.length);
  });
  if (this.stream.ondata)
    this.stream.ondata = null;
  this.stream.removeAllListeners('data');
  this.pipe();
};

Connection.prototype.pipe = function() {
  var connection = this;
  if (this.stream instanceof net.Stream) {
    this.stream.ondata = function(data, start, end) {
      connection.packetParser.execute(data, start, end);
    };
  } else {
    this.stream.on('data', function(data) {
      connection.packetParser.execute(data.parent, data.offset, data.offset + data.length);
    });
  }
};

Connection.prototype.protocolError = function(message, code) {
  var err = new Error(message);
  err.fatal = true;
  err.code = code || 'PROTOCOL_ERROR';
  this.emit('error', err);
}

Connection.prototype.handlePacket = function(packet) {

  if (this._paused)
  {
    this._paused_packets.push(packet);
    return;
  }

  // TODO: check packet sequenceId here
  if (packet)
    this.sequenceId = packet.sequenceId + 1;
  if (this.config.debug) {
    if (packet) {
      console.log(this._internalId + ' ' + this.connectionId + ' ==> ' + this._command._commandName + '#' + this._command.stateName() + '(' + [packet.sequenceId, packet.type(), packet.length()].join(',') + ')');
      console.log(' raw: ' + packet.buffer.slice(packet.offset, packet.offset + packet.length()).toString('hex'));
    }
  }
  if (!this._command) {
    this.protocolError('Unexpected packet while no commands in the queue', 'PROTOCOL_UNEXPECTED_PACKET');
    return this.close();
  }
  var done = this._command.execute(packet, this);
  if (done) {
    this.sequenceId = 0;
    this._command = this._commands.shift();
    if (this._command)
      this.handlePacket();
  }
};

Connection.prototype.addCommand = function(cmd) {
  if (this.config.debug) {
    console.log('Add command: ' + arguments.callee.caller.name);
    cmd._commandName = arguments.callee.caller.name;
  }
  if (!this._command) {
    this._command = cmd;
    this.handlePacket();
  } else {
    this._commands.push(cmd);
  }
  return cmd;
};

Connection.prototype.format = function(sql, values) {
  if (typeof this.config.queryFormat == "function") {
    return this.config.queryFormat.call(this, sql, values, this.config.timezone);
  }
  var opts = {
    sql: sql,
    values: values
  };
  this._resolveNamedPlaceholders(opts);
  return SqlString.format(opts.sql, opts.values, this.config.stringifyObjects, this.config.timezone);
};

Connection.prototype.escape = function(value) {
  return SqlString.escape(value, false, this.config.timezone);
};

Connection.prototype.escapeId = function escapeId(value) {
  return SqlString.escapeId(value, false);
};

function _domainify(callback) {
  var domain = process.domain;
  if (domain && callback)
    return process.domain.bind(callback);
  else
    return callback;
}

var convertNamedPlaceholders = null;
Connection.prototype._resolveNamedPlaceholders = function(options) {
  var unnamed;
  if (this.config.namedPlaceholders || options.namedPlaceholders) {
    if (convertNamedPlaceholders === null)
      convertNamedPlaceholders = require('named-placeholders')();
    unnamed = convertNamedPlaceholders(options.sql, options.values);
    options.sql = unnamed[0];
    options.values = unnamed[1];
  }
};

Connection.prototype.query = function query(sql, values, cb) {
  // copy-paste from node-mysql/lib/Connection.js:createQuery
  var options = {};
  if (typeof sql === 'object') {
    // query(options, cb)
    options = sql;
    if (typeof values === 'function') {
      cb = values;
    } else {
      options.values = values;
    }
  } else if (typeof values === 'function') {
    // query(sql, cb)
    cb             = values;
    options.sql    = sql;
    options.values = undefined;
  } else {
    // query(sql, values, cb)
    options.sql    = sql;
    options.values = values;
  }

  this._resolveNamedPlaceholders(options);
  var rawSql = this.format(options.sql, options.values || []);
  return this.addCommand(new Commands.Query(rawSql, options, _domainify(cb)));
};

Connection.prototype.pause = function pause() {
  this._paused = true;
  this.stream.pause();
};

Connection.prototype.resume= function resume() {
  var packet;
  this._paused = false;
  while( packet = this._paused_packets.shift() ) {
    this.handlePacket(packet);
    // don't resume if packet hander paused connection
    if (this._paused)
      return;
  }
  this.stream.resume();
};

Connection.prototype.keyFromFields = function keyFromFields(fields, options) {
  var res = (typeof options.nestTables) + '/' + options.nestTables + '/' + options.rowsAsHash;
  for (var i=0; i < fields.length; ++i)
    res += '/' + fields[i].name + ':' + fields[i].columnType + ':' + fields[i].flags;
  return res;
}

function statementKey(options) {
  return (typeof options.nestTables) +
    '/' + options.nestTables + '/' + options.rowsAsHash + options.sql;
}

// TODO: named placeholders support
Connection.prototype.prepare = function prepare(options, cb) {
  if (typeof options == 'string')
    options = { sql: options };
  return this.addCommand(new Commands.Prepare(options, _domainify(cb)));
};

Connection.prototype.unprepare = function execute(sql) {
  var options = {};
  if (typeof sql === 'object') {
    options = sql;
  } else
    options.sql    = sql;
  var key  = statementKey(options);
  var stmt = this._statements[key];
  if (stmt) {
    this._statements[key] = null;
    stmt.close();
  }
  return stmt;
};

Connection.prototype.execute = function execute(sql, values, cb) {
  var options = {};
  if (typeof sql === 'object') {
    // execute(options, cb)
    options = sql;
    if (typeof values === 'function') {
      cb = values;
    } else {
      options.values = values;
    }
  } else if (typeof values === 'function') {
    // execute(sql, cb)
    cb             = values;
    options.sql    = sql;
    options.values = undefined;
  } else {
    // execute(sql, values, cb)
    options.sql    = sql;
    options.values = values;
  }
  cb = _domainify(cb);
  this._resolveNamedPlaceholders(options);

  var connection = this;
  var key = statementKey(options);
  var statement = connection._statements[key];

  options.statement = statement;
  var executeCommand = new Commands.Execute(options, cb);

  if (!statement) {
    connection.prepare(options, function executeStatement(err, stmt) {
      if (err) {
        if (cb)
          cb(err);
        else
          executeCommand.emit('error', err);
        return;
      }
      executeCommand.statement = stmt;
      connection._statements[key] = stmt;
      connection.addCommand(executeCommand);
    });
  } else {
    connection.addCommand(executeCommand);
  }
  return executeCommand;
};

Connection.prototype.changeUser = function changeUser(options, callback) {
  if (!callback && typeof options === 'function') {
    callback = options;
    options = {};
  }

  var charsetNumber = (options.charset) ? ConnectionConfig.getCharsetNumber(options.charset) : this.config.charsetNumber;

  return this.addCommand(new Commands.ChangeUser({
    user          : options.user || this.config.user,
    password      : options.password || this.config.password,
    passwordSha1  : options.passwordSha1 || this.config.passwordSha1,
    database      : options.database || this.config.database,
    timeout       : options.timeout,
    charsetNumber : charsetNumber,
    currentConfig : this.config
  }, _domainify(function(err) {
    if (err)
      err.fatal = true;
    if (callback) callback(err);
  })));
};

// transaction helpers
Connection.prototype.beginTransaction = function(cb) {
  return this.query('START TRANSACTION', cb);
};

Connection.prototype.commit = function(cb) {
  return this.query('COMMIT', cb);
};

Connection.prototype.rollback = function(cb) {
  return this.query('ROLLBACK', cb);
};

Connection.prototype.ping = function ping(cb) {
  return this.addCommand(new Commands.Ping(_domainify(cb)));
};

Connection.prototype._registerSlave = function registerSlave(opts, cb) {
  return this.addCommand(new Commands.RegisterSlave(opts, _domainify(cb)));
};

Connection.prototype._binlogDump = function binlogDump(opts, cb) {
  return this.addCommand(new Commands.BinlogDump(opts, _domainify(cb)));
};

// currently just alias to close
Connection.prototype.destroy = function() {
  this.close();
};

Connection.prototype.close = function() {
  this._closing = true;
  this.stream.end();
};

Connection.prototype.createBinlogStream = function(opts) {
  // TODO: create proper stream class
  // TODO: use through2
  var test = 1;
  var Readable = require('stream').Readable;
  var stream = new Readable({objectMode: true});
  stream._read = function() {
    return {
      data: test++
    };
  };
  var connection = this;
  connection._registerSlave(opts, function(err) {
    var dumpCmd = connection._binlogDump(opts);
    dumpCmd.on('event', function(ev) {
      stream.push(ev);
    });
    dumpCmd.on('eof', function() {
      stream.push(null);
      // if non-blocking, then close stream to prevent errors
      if (opts.flags && (opts.flags & 0x01)) {
        connection.close();
      }
    });
    // TODO: pipe errors as well
  });
  return stream;
};

Connection.prototype.connect = function(cb) {
  if (!cb) return;
  var connectCalled = 0;

  // TODO domainify this callback as well. Note that domain has to be captured
  // at the top of function due to nested callback
  function callbackOnce(isErrorHandler) {
    return function(param) {
      if (!connectCalled) {
        if (isErrorHandler)
          cb(param);
        else
          cb(null, param);
      }
      connectCalled = 1;
    };
  }
  this.once('error',   callbackOnce(true) );
  this.once('connect', callbackOnce(false));
};

// ===================================
// outgoing server connection methods
// ===================================

Connection.prototype.writeColumns = function(columns) {
  var connection = this;
  this.writePacket(Packets.ResultSetHeader.toPacket(columns.length));
  columns.forEach(function(column) {
    connection.writePacket(Packets.ColumnDefinition.toPacket(column));
  });
  this.writeEof();
};

// row is array of columns, not hash
Connection.prototype.writeTextRow = function(column) {
  this.writePacket(Packets.TextRow.toPacket(column));
};

Connection.prototype.writeTextResult = function(rows, columns) {
  var connection = this;
  connection.writeColumns(columns);
  rows.forEach(function(row) {
    var arrayRow = new Array(columns.length);
    columns.forEach(function(column) {
      arrayRow.push(row[column.name]);
    });
    connection.writeTextRow(arrayRow);
  });
  connection.writeEof();
};

Connection.prototype.writeEof = function(warnings, statusFlags) {
  this.writePacket(Packets.EOF.toPacket(warnings, statusFlags));
};

Connection.prototype.writeOk = function(args) {
  if (!args)
    args = { affectedRows: 0 };
  this.writePacket(Packets.OK.toPacket(args));
};

Connection.prototype.writeError = function(args) {
  this.writePacket(Packets.Error.toPacket(args));
};

Connection.prototype.serverHandshake = function serverHandshake(args) {
  return this.addCommand(new Commands.ServerHandshake(args));
};

// ===============================================================

// TODO: domainify
Connection.prototype.end = function(callback) {
  var connection = this;
  // trigger error if more commands enqueued after end command
  var quitCmd =  this.addCommand(new Commands.Quit(callback));
  connection.addCommand = function() {
    if (connection._closing) {
      this.emit(new Error('addCommand() called on closing connection'));
    }
  };
  return quitCmd;
};

module.exports = Connection;

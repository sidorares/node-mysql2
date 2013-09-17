var net          = require('net');
var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var Queue        = require('fastqueue');

var PacketParser = require('./packet_parser');
var Packet       = require('./packets/packet');
var Packets      = require('./packets/index.js');
var Commands     = require('./commands/index.js');
var SqlString    = require('./sql_string');

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
    this.stream = opts.config.stream;
  }

  this._commands = new Queue();
  this._command = null;

  this.statements = {};

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

  // big TODO: benchmark if it all worth using 'ondata' and onPacket callbacks directly
  // compositing streams would be much more easier.
  // also, look for existing length-prefixed streams to reuse instead of packet_parser
  //  https://github.com/squaremo/node-spb - currently only fixed 4 byte prefix
  //  ...?


  // TODO: check if bind can be a performance problem
  // see https://gist.github.com/khoomeister/4985691#use-that-instead-of-bind
  this.packetParser = new PacketParser(this.handlePacket.bind(this));

  // TODO: this code used to be an optimized version of handler
  // DOES NOT WORK IN NODE 11
  // TODO: measure if we actually get something here
  // if yes, re-enable for node 10
  //if (this.stream instanceof net.Stream) {
  //  debugger;
  //  this.stream.ondata = function(data, start, end) {
  //    debugger;
  //    connection.packetParser.execute(data, start, end);
  //  };
  //} else {
    this.stream.on('data', function(data) {
      connection.packetParser.execute(data, 0, data.length);
    });
  //}
  this._protocolError = null;
  this.stream.on('end', function() {
    connection.emit('end', connection._protocolError);
  });
  if (!this.config.isServer) {
    this.addCommand(new Commands.ClientHandshake(this.config.clientFlags));
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
  this.sequenceId++;
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
  var connection = this;
  var crypto = require('crypto');
  var tls = require('tls');
  var credentials = crypto.createCredentials({
    key: this.config.ssl.key,
    cert: this.config.ssl.cert,
    passphrase: this.config.ssl.passphrase,
    ca: this.config.ssl.ca
  });
  var securePair = tls.createSecurePair(credentials, false);
  if (this.stream.ondata)
    this.stream.ondata = null;
  this.stream.removeAllListeners('data');
  this.stream.pipe(securePair.encrypted);
  securePair.encrypted.pipe(this.stream);
  securePair.cleartext.on('data', function(data) {
    connection.packetParser.execute(data.parent, data.offset, data.offset + data.length);
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
// cnanges stream -> packetParser to
// stream -> compressedPacketParser -> inflateStream -> packetParser
// note that in the caseof ssl this should become
// stream -> securePair.encrypted -> securePair.cleartext -> compressedPacketParser -> inflateStream -> packetParser
Connection.prototype.startInflate = function() {
  var connection = this;
  var zlib = require('zlib');
  var inflateStream = zlib.createInflate();
  var uncompressedPacketParser = connection.packetParser;
  connection.packetParser = new PacketParser(function(compressedPacket) {
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

Connection.prototype.handlePacket = function(packet) {
  // TODO: check packet sequenceId here
  if (packet)
    this.sequenceId = packet.sequenceId + 1;
  var done = this._command.execute(packet, this);
  if (done) {
    this.sequenceId = 0;
    this._command = this._commands.shift();
    if (this._command)
      this.handlePacket();
  }
};

Connection.prototype.addCommand = function(cmd) {
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
  return SqlString.format(sql, values, this.config.timezone);
};

Connection.prototype.escape = function(value) {
  return SqlString.escape(value, false, this.config.timezone);
};

Connection.prototype.query = function(sql, values, cb) {
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
  var rawSql = this.format(options.sql, options.values || []);
  return this.addCommand(new Commands.Query(rawSql, cb));
};

Connection.prototype.execute = function(sql, values, cb) {
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

  return this.addCommand(new Commands.Execute(options.sql, options.values, cb));
};

Connection.prototype.ping = function(cb) {
  return this.addCommand(new Commands.Ping(cb));
};

Connection.prototype.connect = function(cb) {
  // TODO: call cb only after succesfull handshake response
  // on('connect') handler?
  if (cb) {
    this.once('error', cb);
    this.once('connect', function() { cb(null); });
  }
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

Connection.prototype.serverHandshake = function(args) {
  return this.addCommand(new Commands.ServerHandshake(args));
};

// ===============================================================

Connection.prototype.end = function(callback) {
  // TODO: implement COM_QUIT command
  var endCmd = { connection: this };
  endCmd.execute = function() {
    this.connection.stream.end();
    if (callback)
      callback();
  };
  return this.addCommand(endCmd);
  //return this.addCommand(new Commands.Quit(callback));
};

module.exports = Connection;

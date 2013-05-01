var _            = require('underscore');
var net          = require('net');

var PacketParser = require('./packet_parser');
var Packet       = require('./packets/packet');
var Commands     = require('./commands/index.js');
var EventEmitter = require('events').EventEmitter;
var util   = require('util');

function Connection(opts)
{
  EventEmitter.call(this);
  // params are encoded as url string
  if (typeof opts == 'string')
  {
    var url = opts;
    opts = {};
    var params = require('url').parse(url, true);
    opts.host = params.host;
    opts.database = params.pathname.substring(1);
    var userPass = params.auth.split(':');
    opts.user = userPass[0];
    opts.password = userPass[1];
    if (params.query.flags)
      opts.flags = params.query.flags.split(',');
    _.extend(opts, _.pick(params.query, 'socketPath', 'charset', 'timezone', 'insecureAuth', 'typeCast', 'supportBigNumbers', 'debug'));
  }

  // TODO: fill defaults
  // if no params, connect to /var/lib/mysql/mysql.sock ( /tmp/mysql.sock on OSX )
  // if host is given, connect to host:3306

  // TODO: use `/usr/local/mysql/bin/mysql_config --socket` output? as default socketPath
  // if there is no host/port and no socketPath parameters?

  if (!opts.stream) {
    if (opts.socketPath)
      this.stream = net.connect(opts.socketPath);
    else
      this.stream = net.connect(opts.port, opts.host);
  } else {
    this.stream = stream;
  }
  this.opts = opts;
  this.commands = [];
  this.statements = {};

  // TODO: make it lru cache
  // https://github.com/mercadolibre/node-simple-lru-cache
  // or https://github.com/rsms/js-lru
  // or https://github.com/monsur/jscache
  //
  // key is field.name + ':' + field.columnType + ':' field.flags + '/'
  this.textProtocolParsers = {};

  // TODO: not sure if cache should be separate (same key as with textProtocolParsers)
  // or part of prepared statements cache (key is sql query)
  this.binaryProtocolParsers = {};

  this.serverCapabilityFlags = 0;
  this.authorized = false;

  var connection = this;

  // TODO: check if bind can be a performance problem
  // see https://gist.github.com/khoomeister/4985691#use-that-instead-of-bind
  this.packetParser = new PacketParser(this.handlePacket.bind(this));

  if (this.stream instanceof net.Stream) {
    this.stream.ondata = function(data, start, end) {
      connection.packetParser.execute(data, start, end);
    };
  } else {
    this.stream.on('data', function(data) {
      connection.packetParser.execute(data.parent, data.offset, data.offset + data.length);
    });
  }
  this.addCommand(new Commands.Handshake());
}
util.inherits(Connection, EventEmitter);

Connection.prototype.write = function(buffer) {
  this.stream.write(buffer);
};

// TODO: replace function in runtime instead of having if() here
// Needs benchmark.
Connection.prototype.writePacket = function(packet) {
  packet.writeHeader();
  if (!this.opts.compress || !this.authorized) {
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
    key: this.opts.ssl.key,
    cert: this.opts.ssl.cert,
    passphrase: this.opts.ssl.passphrase
    // TODO ca-certs list
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

Connection.prototype.handlePacket = function(packet) {
  var commands = this.commands;
  var done = commands[0].execute(packet, this);
  if (done) {
    commands.shift();
    if (commands.length !== 0)
      this.handlePacket(); // TODO: process.nextTick to avoid recursion?
  }
};

Connection.prototype.addCommand = function(cmd) {
  this.commands.push(cmd);
  if (this.commands.length == 1) {
    this.commands[0].execute(null, this);
  }
  return cmd;
};

Connection.prototype.query = function(sql, callback) {
  return this.addCommand(new Commands.Query(sql, callback));
};

Connection.prototype.execute = function(sql, params, callback) {
  return this.addCommand(new Commands.Execute(sql, params, callback));
};

Connection.prototype.connect = function(cb) {
  // TODO: call cb only after succesfull handshake response
  // on('connect') handler?
  if (cb) cb(null);
  //console.warn('Connection.connect is no-op in mysql2');
};

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

Connection.prototype.escape = function(str) {
  // copy-paste from mysql-native. Currenty only used by benchmark
  str = str.replace(/\0/g, "\\0");
  str = str.replace(/\n/g, "\\n");
  str = str.replace(/\r/g, "\\r");
  str = str.replace(/\032/g, "\\Z");
  str = str.replace(/([\'\"]+)/g, "\\$1");
  return str;
};

module.exports = Connection;


//var c = new Connection({ host: 'localhost', port: 3306, user: 'root', password: 'test', database: 'test' });
//var sql = "select * from foos limit ?";
/*
c.execute(sql, 123, function(err, rows, fields) {
  console.log(err, rows);
});
*/
//c.query('select * from foos', function() {
//});


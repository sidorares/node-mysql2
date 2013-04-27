var _            = require('underscore');
var net          = require('net');

var PacketParser = require('./packet_parser');
var Commands     = require('./commands/index.js');

function Connection(opts)
{
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

  var connection = this;
  this.packetParser = new PacketParser(this.handlePacket.bind(this));
  // TODO: check stream instanceof net.Stream, fallback if not
  this.stream.ondata = function(data, start, end) {
    connection.packetParser.execute(data, start, end);
  };
  this.addCommand(new Commands.Handshake());
}

Connection.prototype.writePacket = function(packet) {
  packet.writeHeader();
  this.stream.write(packet.buffer);
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

Connection.prototype.connect = function() {
  console.warn('Connection.connect is no-op in mysql2');
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


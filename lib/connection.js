var _            = require('underscore');
var net          = require('net');

var PacketParser = require('./packet_parser');
var Commands     = require('./commands/index.js');

function Connection(opts)
{
  console.log('CONNECT ARGUMENTS:', opts);
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
    _.extend(opts, _.pick(params.query, 'socketPath', 'charset', 'timesone', 'insecureAuth', 'typeCast', 'supportBigNumbers', 'debug'));
  }
  // fill defaults
  // if no params, connect to /var/lib/mysql/mysql.sock ( /tmp/mysql.sock on OSX )
  // if host is given, connect to host:3306

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
  this._cmdBytesReceived = 0;

  var connection = this;
  var cnt = 0;
  //var startTime = process.hrtime();
  var handlePacket = function(packet) {
    if (packet) {
      connection._cmdBytesReceived += packet.payload.length + 4;
    }
    //console.log('packet num: ', cnt);
    //cnt++;
    //if (cnt == 500007) {
    //  var end = process.hrtime(startTime);
    //  var ns = end[1] + end[0]*10e9;
    //  console.log('Done!', 500000*10e9/ns);
    //}
    //if (cnt > 5)
    //  return;

    //
    //if (packet)
    //  console.log('PACKET:', packet.payload, packet.payload.length);
    var done = connection.commands[0].execute(packet, connection);
    if (done) {
      connection.commands.shift();
      if (connection.commands.length !== 0)
        handlePacket(); // TODO: process.nextTick ?
    }
  };
  this.packetParser = new PacketParser(handlePacket);
  //this.stream.pipe(this.packetParser);
  this.stream.resume();
  var cnt1 = 0;
  this.stream.ondata = function(data, start, end) {
    //console.log(data, start, end);
    //cnt1++;
    //console.log('cnt1: ', cnt1);
    // 183
    connection.packetParser._write(data.slice(start, end));
  };
  this.addCommand(new Commands.Handshake());
}

Connection.prototype.writePacket = function(packet) {
  packet.writeHeader();
  var data = packet.payload;
  this.stream.write(data);
  //console.log('<<< ', packet.payload);
  //console.log('<<< ', [packet.payload.toString()]);
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


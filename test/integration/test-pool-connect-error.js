var util = require('util');
var mysql = require('../../index.js');
var Command = require('../../lib/commands/command.js');
var Packets = require('../../lib/packets/index.js');

var assert = require('assert');

var server = mysql.createServer(function (conn) {
  conn.serverHandshake({
    protocolVersion: 10,
    serverVersion: '5.6.10', //'node.js rocks',
    connectionId: 1234,
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags: 0xffffff,
    authCallback: function(params, cb) {
      cb(null, { message: 'too many connections', code: 1040});
    }
  });
});

var err1, err2;

var portfinder = require('portfinder');
portfinder.getPort(function (err, port) {

  server.listen(port);
  var conn = mysql.createConnection({
    user: 'test_user',
    password: 'test',
    database: 'test_database',
    port: port
  });
  conn.on('error', function (err) {
    err1 = err
  });

  var pool = mysql.createPool({
    user: 'test_user',
    password: 'test',
    database: 'test_database',
    port: port
  });

  pool.query('test sql', function (err, res, rows) {
    err2 = err;
  });

});

process.on('exit', function() {
  assert.equal(err1.errno, 1040);
  assert.equal(err2.errno, 1040);
});

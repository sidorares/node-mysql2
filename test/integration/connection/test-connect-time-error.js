var mysql = require('../../../index.js');
var assert = require('assert');
var Buffer = require('safe-buffer').Buffer;

var server;

const ERROR_TEXT = 'test error';

var portfinder = require('portfinder');
portfinder.getPort(function(err, port) {
  var server = mysql.createServer();
  server.listen(port);
  server.on('connection', function(conn) {
    console.log('Here!');
    conn.writeError(new Error(ERROR_TEXT));
    conn.close();
  });

  var connection = mysql.createConnection({
    host: 'localhost',
    port: port,
    user: 'testuser',
    database: 'testdatabase',
    password: 'testpassword'
  });

  connection.query('select 1+1', function(err) {
    assert.equal(err.message, ERROR_TEXT);
  });

  connection.query('select 1+2', function(err) {
    assert.equal(err.message, ERROR_TEXT);
    connection.close();
    server._server.close();
  });
});

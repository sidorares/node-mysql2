'use strict';
const portfinder = require('portfinder');
const assert = require('assert');
const mysql = require('../../../index.js');

console.log('test connect timeout');

portfinder.getPort((err, port) => {
  const server = mysql.createServer();
  server.on('connection', () => {
    // Let connection time out
  });

  server.listen(port);

  const connection = mysql.createConnection({ 
    host: 'localhost',
    port: port,
    connectTimeout: 1000,
  });

  connection.on('error', err => {
    assert.equal(err.code, 'ETIMEDOUT');
    connection.destroy();
    server._server.close();
    console.log('ok');
  });
});

process.on('uncaughtException', err => {
  assert.equal(err.message, 'Connection lost: The server closed the connection.');
  assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
});

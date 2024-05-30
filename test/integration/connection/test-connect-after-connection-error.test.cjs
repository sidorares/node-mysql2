'use strict';

const mysql = require('../../../index.js');
const { assert } = require('poku');
const process = require('node:process');

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

const ERROR_TEXT = 'Connection lost: The server closed the connection.';

const portfinder = require('portfinder');
portfinder.getPort((err, port) => {
  const server = mysql.createServer();
  let serverConnection;
  server.listen(port);
  server.on('connection', (conn) => {
    conn.serverHandshake({
      serverVersion: '5.6.10',
      capabilityFlags: 2181036031,
    });
    serverConnection = conn;
  });

  const clientConnection = mysql.createConnection({
    host: 'localhost',
    port: port,
    user: 'testuser',
    database: 'testdatabase',
    password: 'testpassword',
  });

  clientConnection.on('connect', () => {
    serverConnection.close();
  });

  clientConnection.once('error', () => {
    clientConnection.connect((err) => {
      assert.equal(err.message, ERROR_TEXT);
      clientConnection.close();
      server._server.close();
    });
  });
});

'use strict';

const mysql = require('../../../index.js');
const { assert } = require('poku');
const process = require('node:process');
const portfinder = require('portfinder');

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

const ERROR_TEXT = 'Connection lost: The server closed the connection.';

portfinder.getPort((err, port) => {
  const server = mysql.createServer();
  server.listen(port);
  server.on('connection', (conn) => {
    conn.close();
  });

  const connection = mysql.createConnection({
    host: 'localhost',
    port: port,
    user: 'testuser',
    database: 'testdatabase',
    password: 'testpassword',
  });

  connection.query('select 1', (err) => {
    assert.equal(err.message, ERROR_TEXT);
    server._server.close();
  });
});

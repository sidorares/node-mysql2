'use strict';

const mysql = require('../../../index.js');
const assert = require('assert');

const ERROR_TEXT = 'Connection lost: The server closed the connection.';

const portfinder = require('portfinder');

portfinder.getPort((err, port) => {
  const server = mysql.createServer();
  server.listen(port);
  server.on('connection', conn => {
    conn.close();
  });

  const connection = mysql.createConnection({
    host: 'localhost',
    port: port,
    user: 'testuser',
    database: 'testdatabase',
    password: 'testpassword'
  });

  connection.query('select 1', err => {
    assert.equal(err.message, ERROR_TEXT);
    server._server.close();
  });
});


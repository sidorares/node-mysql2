'use strict';

const mysql = require('../../../index.js');
const assert = require('assert');

const ERROR_TEXT = 'test error';

const portfinder = require('portfinder');
portfinder.getPort((err, port) => {
  const server = mysql.createServer();
  server.listen(port);
  server.on('connection', conn => {
    conn.writeError(new Error(ERROR_TEXT));
    conn.close();
  });

  const connection = mysql.createConnection({
    host: 'localhost',
    port: port,
    user: 'testuser',
    database: 'testdatabase',
    password: 'testpassword'
  });

  connection.query('select 1+1', err => {
    assert.equal(err.message, ERROR_TEXT);
  });

  connection.query('select 1+2', err => {
    assert.equal(err.message, ERROR_TEXT);
    connection.close();
    server._server.close();
  });
});

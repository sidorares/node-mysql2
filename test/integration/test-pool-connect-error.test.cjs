'use strict';

const mysql = require('../../index.js');
const { assert } = require('poku');
const process = require('node:process');
const portfinder = require('portfinder');

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

const server = mysql.createServer((conn) => {
  conn.serverHandshake({
    protocolVersion: 10,
    serverVersion: '5.6.10',
    connectionId: 1234,
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags: 0xffffff,
    authCallback: function (params, cb) {
      cb(null, { message: 'too many connections', code: 1040 });
    },
  });
});

let err1, err2;

portfinder.getPort((err, port) => {
  server.listen(port);
  const conn = mysql.createConnection({
    user: 'test_user',
    password: 'test',
    database: 'test_database',
    port: port,
  });
  conn.on('error', (err) => {
    err1 = err;
  });

  const pool = mysql.createPool({
    user: 'test_user',
    password: 'test',
    database: 'test_database',
    port: port,
  });

  pool.query('test sql', (err) => {
    err2 = err;
    pool.end();
    server.close();
  });
});

process.on('exit', () => {
  assert.equal(err1.errno, 1040);
  assert.equal(err2.errno, 1040);
});

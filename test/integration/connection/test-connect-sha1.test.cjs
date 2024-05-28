'use strict';

const mysql = require('../../../index.js');
const auth = require('../../../lib/auth_41.js');
const { assert } = require('poku');
const { Buffer } = require('node:buffer');
const process = require('node:process');

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

function authenticate(params, cb) {
  const doubleSha = auth.doubleSha1('testpassword');
  const isValid = auth.verifyToken(
    params.authPluginData1,
    params.authPluginData2,
    params.authToken,
    doubleSha,
  );
  assert(isValid);
  cb(null);
}

let _1_2 = false;
let _1_3 = false;

let queryCalls = 0;

const portfinder = require('portfinder');
portfinder.getPort((err, port) => {
  const server = mysql.createServer();
  server.listen(port);
  server.on('connection', (conn) => {
    conn.serverHandshake({
      protocolVersion: 10,
      serverVersion: 'node.js rocks',
      connectionId: 1234,
      statusFlags: 2,
      characterSet: 8,
      capabilityFlags: 0xffffff,
      authCallback: authenticate,
    });
    conn.on('query', (sql) => {
      assert.equal(sql, 'select 1+1');
      queryCalls++;
      conn.close();
    });
  });

  const connection = mysql.createConnection({
    port: port,
    user: 'testuser',
    database: 'testdatabase',
    passwordSha1: Buffer.from(
      '8bb6118f8fd6935ad0876a3be34a717d32708ffd',
      'hex',
    ),
  });

  connection.on('error', (err) => {
    assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
  });

  connection.query('select 1+1', (err) => {
    assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
    server._server.close();
  });

  connection.query('select 1+2', (err) => {
    assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
    _1_2 = true;
  });

  connection.query('select 1+3', (err) => {
    assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
    _1_3 = true;
  });
});

process.on('exit', () => {
  assert.equal(queryCalls, 1);
  assert.equal(_1_2, true);
  assert.equal(_1_3, true);
});

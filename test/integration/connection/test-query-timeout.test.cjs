'use strict';

const portfinder = require('portfinder');
const common = require('../../common.test.cjs');
const mysql = require('../../../index.js');
const assert = require('node:assert');
const process = require('node:process');

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

const connection = common.createConnection({ debug: false });

connection.query({ sql: 'SELECT sleep(3) as a', timeout: 500 }, (err, res) => {
  assert.equal(res, null);
  assert.ok(err);
  assert.equal(err.code, 'PROTOCOL_SEQUENCE_TIMEOUT');
  assert.equal(err.message, 'Query inactivity timeout');
});

connection.query({ sql: 'SELECT sleep(1) as a', timeout: 5000 }, (err, res) => {
  assert.deepEqual(res, [{ a: 0 }]);
});

connection.query('SELECT sleep(1) as a', (err, res) => {
  assert.deepEqual(res, [{ a: 0 }]);
});

connection.execute(
  { sql: 'SELECT sleep(3) as a', timeout: 500 },
  (err, res) => {
    assert.equal(res, null);
    assert.ok(err);
    assert.equal(err.code, 'PROTOCOL_SEQUENCE_TIMEOUT');
    assert.equal(err.message, 'Query inactivity timeout');
  },
);

connection.execute(
  { sql: 'SELECT sleep(1) as a', timeout: 5000 },
  (err, res) => {
    assert.deepEqual(res, [{ a: 0 }]);
  },
);

connection.query(
  { sql: 'select 1 from non_existing_table', timeout: 500 },
  (err, res) => {
    assert.equal(res, null);
    assert.ok(err);
    assert.equal(err.code, 'ER_NO_SUCH_TABLE');
  },
);

connection.execute('SELECT sleep(1) as a', (err, res) => {
  assert.deepEqual(res, [{ a: 0 }]);
  connection.end();
});

/**
 * if connect timeout
 * we should return connect timeout error instead of query timeout error
 */
portfinder.getPort((err, port) => {
  const server = mysql.createServer();
  server.on('connection', () => {
    // Let connection time out
  });
  server.listen(port);

  const connectionTimeout = mysql.createConnection({
    host: 'localhost',
    port: port,
    connectTimeout: 1000,
  });

  // return connect timeout error first
  connectionTimeout.query(
    { sql: 'SELECT sleep(3) as a', timeout: 50 },
    (err, res) => {
      console.log('ok');
      assert.equal(res, null);
      assert.ok(err);
      assert.equal(err.code, 'ETIMEDOUT');
      assert.equal(err.message, 'connect ETIMEDOUT');
      connectionTimeout.destroy();
      server._server.close();
    },
  );
});

process.on('uncaughtException', (err) => {
  assert.equal(
    err.message,
    'Connection lost: The server closed the connection.',
  );
  assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
});

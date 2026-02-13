'use strict';

const mysql = require('../../../index.js');
const { assert } = require('poku');
const process = require('node:process');
const portfinder = require('portfinder');
const ClientFlags = require('../../../lib/constants/client.js');

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

// Simulate Aurora MySQL failover: a writable connection becomes read-only.
// After failover, writes return error 1290 (ER_OPTION_PREVENTS_STATEMENT).
//
// This test verifies that when a pooled connection hits error 1290,
// the pool discards that connection and creates a fresh one for the next
// caller, rather than returning the stale read-only connection.

let connId = 0;
let failoverTriggered = false;

const readOnlyError = {
  code: 1290,
  message:
    'The MySQL server is running with the --read-only option so it cannot execute this statement',
};

const server = mysql.createServer((conn) => {
  conn.on('error', () => {});

  let flags = 0xffffff;
  flags = flags ^ (ClientFlags.COMPRESS | ClientFlags.SSL);

  conn.serverHandshake({
    protocolVersion: 10,
    serverVersion: 'node.js rocks',
    connectionId: ++connId,
    statusFlags: 2,
    characterSet: 8,
    capabilityFlags: flags,
  });

  conn.on('query', () => {
    if (!failoverTriggered) {
      conn.writeOk();
    } else {
      conn.writeError(readOnlyError);
    }
  });

  conn.on('stmt_prepare', () => {
    if (!failoverTriggered) {
      conn.writeOk();
    } else {
      conn.writeError(readOnlyError);
    }
  });
});

let writeError;
let firstThreadId;
let secondThreadId;
let executeError;
let executeFirstThreadId;
let executeSecondThreadId;

portfinder.getPort((err, port) => {
  server.listen(port);

  const pool = mysql.createPool({
    host: 'localhost',
    port: port,
    user: 'test',
    database: 'test',
    connectionLimit: 1,
  });

  // First query succeeds — connection is writable
  pool.query('INSERT INTO t VALUES (1)', (err) => {
    assert.ifError(err);

    pool.getConnection((err, conn) => {
      assert.ifError(err);
      firstThreadId = conn.threadId;
      conn.release();

      // Trigger failover — all subsequent writes return 1290
      failoverTriggered = true;

      pool.query('INSERT INTO t VALUES (2)', (err) => {
        writeError = err;

        // After the read-only error, the pool should discard the bad
        // connection and give us a new one
        pool.getConnection((err, conn2) => {
          assert.ifError(err);
          secondThreadId = conn2.threadId;
          conn2.release();

          // Now test pool.execute() — failover is still active, so the
          // prepare will return error 1290 and pool should discard the conn
          pool.getConnection((err, conn3) => {
            assert.ifError(err);
            executeFirstThreadId = conn3.threadId;
            conn3.release();

            pool.execute('INSERT INTO t VALUES (?)', [4], (err) => {
              executeError = err;

              pool.getConnection((err, conn4) => {
                assert.ifError(err);
                executeSecondThreadId = conn4.threadId;
                conn4.release();
                pool.end(() => {
                  server.close();
                });
              });
            });
          });
        });
      });
    });
  });
});

process.on('exit', () => {
  assert.ok(writeError, 'Expected a write error after failover (query)');
  assert.equal(writeError.errno, 1290);
  assert.equal(writeError.code, 'ER_OPTION_PREVENTS_STATEMENT');
  assert.notEqual(
    firstThreadId,
    secondThreadId,
    'Pool should have discarded the read-only connection and created a new one (query)'
  );

  assert.ok(executeError, 'Expected a write error after failover (execute)');
  assert.equal(executeError.errno, 1290);
  assert.equal(executeError.code, 'ER_OPTION_PREVENTS_STATEMENT');
  assert.notEqual(
    executeFirstThreadId,
    executeSecondThreadId,
    'Pool should have discarded the read-only connection and created a new one (execute)'
  );
});

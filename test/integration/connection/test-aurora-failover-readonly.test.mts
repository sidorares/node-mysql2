import type { QueryError } from '../../../index.js';
import { describe, it, skip, strict } from 'poku';
import mysql from '../../../index.js';
import ClientFlags from '../../../lib/constants/client.js';

type FailoverResult = {
  errorReceived: QueryError | undefined;
  firstThreadId: number;
  secondThreadId: number;
};

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

// Simulate Aurora MySQL failover: a writable connection becomes read-only.
// After failover, writes return one of these read-only errors:
//   1290: ER_OPTION_PREVENTS_STATEMENT (server running with --read-only)
//   1792: ER_CANT_EXECUTE_IN_READ_ONLY_TRANSACTION
//   1836: ER_READ_ONLY_MODE
//
// This test verifies that when a pooled connection hits any of these errors,
// the pool discards that connection and creates a fresh one for the next
// caller, rather than returning the stale read-only connection.

let connId = 0;

const readOnlyErrors = [
  {
    code: 1290,
    name: 'ER_OPTION_PREVENTS_STATEMENT',
    message:
      'The MySQL server is running with the --read-only option so it cannot execute this statement',
  },
  {
    code: 1792,
    name: 'ER_CANT_EXECUTE_IN_READ_ONLY_TRANSACTION',
    message: 'Cannot execute statement in a READ ONLY transaction',
  },
  {
    code: 1836,
    name: 'ER_READ_ONLY_MODE',
    message: 'Running in read-only mode',
  },
];

// Helper to create a test scenario for a specific error code and method
async function testReadOnlyError(
  errorConfig: (typeof readOnlyErrors)[number],
  method: string
) {
  return new Promise<FailoverResult>((resolve, reject) => {
    let failoverTriggered = false;

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
          conn.writeError(errorConfig);
        }
      });

      conn.on('stmt_prepare', () => {
        if (!failoverTriggered) {
          conn.writeOk();
        } else {
          conn.writeError(errorConfig);
        }
      });
    });

    // @ts-expect-error: TODO: implement typings
    server.listen(0, async () => {
      // @ts-expect-error: internal access
      const port = server._server.address().port;

      const pool = mysql
        .createPool({
          host: 'localhost',
          port: port,
          user: 'test',
          database: 'test',
          connectionLimit: 1,
        })
        .promise();

      try {
        // First query succeeds — connection is writable
        await pool.query('INSERT INTO t VALUES (1)');

        // Get initial connection threadId
        const conn = await pool.getConnection();
        const firstThreadId = conn.threadId;
        conn.release();

        // Trigger failover — all subsequent writes return read-only error
        failoverTriggered = true;

        // Execute test based on method type
        let errorReceived: QueryError | undefined;
        try {
          if (method === 'query') {
            await pool.query('INSERT INTO t VALUES (2)');
          } else {
            await pool.execute('INSERT INTO t VALUES (?)', [2]);
          }
        } catch (err) {
          errorReceived = err as QueryError;
        }

        // After error, pool should have discarded connection and created new one
        const conn2 = await pool.getConnection();
        const secondThreadId = conn2.threadId;
        conn2.release();

        // Cleanup
        await pool.end();

        server.close(() => {
          resolve({
            errorReceived,
            firstThreadId,
            secondThreadId,
          });
        });
      } catch (err) {
        reject(err);
      }
    });
  });
}

await describe('Aurora MySQL Failover - Read-Only Error Handling', async () => {
  for (const errorConfig of readOnlyErrors) {
    await it(`should discard connection on pool.query() when error ${errorConfig.code} occurs`, async () => {
      const result = await testReadOnlyError(errorConfig, 'query');

      strict.ok(result.errorReceived, 'Should receive an error');
      strict.equal(
        result.errorReceived?.errno,
        errorConfig.code,
        `Error code should be ${errorConfig.code}`
      );
      strict.notEqual(
        result.firstThreadId,
        result.secondThreadId,
        'Pool should have created a new connection (different threadId)'
      );
    });

    await it(`should discard connection on pool.execute() when error ${errorConfig.code} occurs`, async () => {
      const result = await testReadOnlyError(errorConfig, 'execute');

      strict.ok(result.errorReceived, 'Should receive an error');
      strict.equal(
        result.errorReceived?.errno,
        errorConfig.code,
        `Error code should be ${errorConfig.code}`
      );
      strict.notEqual(
        result.firstThreadId,
        result.secondThreadId,
        'Pool should have created a new connection (different threadId)'
      );
    });
  }
});

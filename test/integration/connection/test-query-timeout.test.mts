import assert from 'node:assert';
import { describe, it, skip } from 'poku';
import mysql from '../../../index.js';
import { createConnection } from '../../common.test.mjs';

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

await describe('Query Timeout', async () => {
  const connection = createConnection({ debug: false });
  connection.on('error', (err: NodeJS.ErrnoException) => {
    assert.equal(
      err.message,
      'Connection lost: The server closed the connection.'
    );
    assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
  });

  await it('should handle query and execute timeouts', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query(
        { sql: 'SELECT sleep(3) as a', timeout: 500 },
        (err, res) => {
          try {
            assert.equal(res, null);
            assert.ok(err);
            assert.equal(err.code, 'PROTOCOL_SEQUENCE_TIMEOUT');
            assert.equal(err.message, 'Query inactivity timeout');
          } catch (e) {
            reject(e);
          }
        }
      );

      connection.query(
        { sql: 'SELECT sleep(1) as a', timeout: 5000 },
        (_err, res) => {
          try {
            assert.deepEqual(res, [{ a: 0 }]);
          } catch (e) {
            reject(e);
          }
        }
      );

      connection.query('SELECT sleep(1) as a', (_err, res) => {
        try {
          assert.deepEqual(res, [{ a: 0 }]);
        } catch (e) {
          reject(e);
        }
      });

      connection.execute(
        { sql: 'SELECT sleep(3) as a', timeout: 500 },
        (err, res) => {
          try {
            assert.equal(res, null);
            assert.ok(err);
            assert.equal(err.code, 'PROTOCOL_SEQUENCE_TIMEOUT');
            assert.equal(err.message, 'Query inactivity timeout');
          } catch (e) {
            reject(e);
          }
        }
      );

      connection.execute(
        { sql: 'SELECT sleep(1) as a', timeout: 5000 },
        (_err, res) => {
          try {
            assert.deepEqual(res, [{ a: 0 }]);
          } catch (e) {
            reject(e);
          }
        }
      );

      connection.query(
        { sql: 'select 1 from non_existing_table', timeout: 500 },
        (err, res) => {
          try {
            assert.equal(res, null);
            assert.ok(err);
            assert.equal(err.code, 'ER_NO_SUCH_TABLE');
          } catch (e) {
            reject(e);
          }
        }
      );

      connection.execute('SELECT sleep(1) as a', (_err, res) => {
        try {
          assert.deepEqual(res, [{ a: 0 }]);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  connection.end();

  /**
   * if connect timeout
   * we should return connect timeout error instead of query timeout error
   */
  // @ts-expect-error: TODO: implement typings
  const timeoutServer = mysql.createServer();
  timeoutServer.on('connection', (conn) => {
    conn.on('error', (err: NodeJS.ErrnoException) => {
      assert.equal(
        err.message,
        'Connection lost: The server closed the connection.'
      );
      assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
    });
  });

  let connectionTimeout: ReturnType<typeof mysql.createConnection> | undefined;

  await it('should return connect timeout error instead of query timeout error', async () => {
    const port = await new Promise<number>((resolve) => {
      // @ts-expect-error: TODO: implement typings
      timeoutServer.listen(0, () => {
        // @ts-expect-error: internal access
        resolve(timeoutServer._server.address().port);
      });
    });

    connectionTimeout = mysql.createConnection({
      host: 'localhost',
      port,
      connectTimeout: 1000,
    });

    const result = await new Promise<{
      err: NodeJS.ErrnoException | null;
      res: unknown;
    }>((resolve) => {
      connectionTimeout!.query(
        { sql: 'SELECT sleep(3) as a', timeout: 50 },
        (err, res) => resolve({ err, res })
      );
    });

    assert.equal(result.res, null);
    assert.ok(result.err);
    assert.equal(result.err.code, 'ETIMEDOUT');
    assert.equal(result.err.message, 'connect ETIMEDOUT');
  });

  connectionTimeout?.destroy();

  await new Promise<void>((resolve) => {
    // @ts-expect-error: internal access
    timeoutServer._server.close(() => resolve());
  });
});

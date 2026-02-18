import assert from 'node:assert';
import process from 'node:process';
import { describe, it } from 'poku';
import mysql from '../../../../index.js';
import { createConnection } from '../../common.test.mjs';

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

await describe('Query Timeout', async () => {
  await it('should handle query and execute timeouts', async () => {
    const connection = createConnection({ debug: false });

    connection.on('error', (err: NodeJS.ErrnoException) => {
      assert.equal(
        err.message,
        'Connection lost: The server closed the connection.'
      );
      assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
    });

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
          connection.end();
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  /**
   * if connect timeout
   * we should return connect timeout error instead of query timeout error
   */
  await it('should return connect timeout error instead of query timeout error', async () => {
    await new Promise<void>((resolve, reject) => {
      // @ts-expect-error: TODO: implement typings
      const server = mysql.createServer();
      server.on('connection', (conn) => {
        conn.on('error', (err: NodeJS.ErrnoException) => {
          assert.equal(
            err.message,
            'Connection lost: The server closed the connection.'
          );
          assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
        });
      });
      // @ts-expect-error: TODO: implement typings
      server.listen(0, () => {
        // @ts-expect-error: internal access
        const port = server._server.address().port;

        const connectionTimeout = mysql.createConnection({
          host: 'localhost',
          port: port,
          connectTimeout: 1000,
        });

        // return connect timeout error first
        connectionTimeout.query(
          { sql: 'SELECT sleep(3) as a', timeout: 50 },
          (err, res) => {
            try {
              console.log('ok');
              assert.equal(res, null);
              assert.ok(err);
              assert.equal(err.code, 'ETIMEDOUT');
              assert.equal(err.message, 'connect ETIMEDOUT');
              connectionTimeout.destroy();
              // @ts-expect-error: internal access
              server._server.close(() => {
                resolve();
              });
            } catch (e) {
              reject(e);
            }
          }
        );
      });
    });
  });
});

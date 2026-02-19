import process from 'node:process';
import { assert, describe, it } from 'poku';
import mysql from '../../../index.js';

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

process.on('uncaughtException', (err: NodeJS.ErrnoException) => {
  if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'EPIPE') return;
  throw err;
});

await describe('Pool Connect Error', async () => {
  await it('should emit error code 1040 for connection and pool', async () => {
    let err1: NodeJS.ErrnoException | undefined;
    let err2: NodeJS.ErrnoException | undefined;

    await new Promise<void>((resolve) => {
      const server = mysql.createServer((conn) => {
        conn.serverHandshake({
          protocolVersion: 10,
          serverVersion: '5.6.10',
          connectionId: 1234,
          statusFlags: 2,
          characterSet: 8,
          capabilityFlags: 0xffffff,
          // @ts-expect-error: TODO: implement typings
          authCallback: function (_params, cb) {
            cb(null, { message: 'too many connections', code: 1040 });
          },
        });
      });

      let done = false;

      // @ts-expect-error: TODO: implement typings
      server.listen(0, () => {
        // @ts-expect-error: internal access
        const port = server._server.address().port;

        let poolEnded = false;

        const conn = mysql.createConnection({
          user: 'test_user',
          password: 'test',
          database: 'test_database',
          port: port,
        });

        const checkDone = () => {
          if (done || err1 === undefined || err2 === undefined || !poolEnded)
            return;
          done = true;
          conn.destroy();
          server.close(() => resolve());
        };

        conn.on('error', (err) => {
          err1 = err;
          checkDone();
        });

        const pool = mysql.createPool({
          user: 'test_user',
          password: 'test',
          database: 'test_database',
          port: port,
        });

        pool.query('test sql', (err) => {
          err2 = err ?? undefined;
          pool.end(() => {
            poolEnded = true;
            checkDone();
          });
        });
      });
    });

    assert.equal(err1?.errno, 1040);
    assert.equal(err2?.errno, 1040);
  });
});

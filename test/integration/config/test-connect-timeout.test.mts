import process from 'node:process';
import { assert, describe, it } from 'poku';
import mysql from '../../../index.js';

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

await describe('Connect Timeout', async () => {
  await it('should emit ETIMEDOUT error on connection timeout', async () => {
    await new Promise<void>((resolve) => {
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

        const connection = mysql.createConnection({
          host: 'localhost',
          port: port,
          connectTimeout: 1000,
        });

        connection.on('error', (err) => {
          assert.equal(err.code, 'ETIMEDOUT');
          connection.destroy();
          // @ts-expect-error: internal access
          server._server.close(() => {
            resolve();
          });
        });
      });
    });
  });
});

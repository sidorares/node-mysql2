import type { Connection } from '../../../../index.js';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import portfinder from 'portfinder';
import mysql from '../../../../index.js';

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

await describe('Connect Connection Closed Error', async () => {
  const ERROR_TEXT = 'Connection lost: The server closed the connection.';

  await it('should return error when server closes connection', async () => {
    await new Promise<void>((resolve) => {
      portfinder.getPort((_err, port) => {
        // @ts-expect-error: TODO: implement typings
        const server = mysql.createServer();
        server.listen(port);
        server.on('connection', (conn: Connection) => {
          // @ts-expect-error: TODO: implement typings
          conn.close();
        });

        const connection = mysql.createConnection({
          host: 'localhost',
          port: port,
          user: 'testuser',
          database: 'testdatabase',
          password: 'testpassword',
        });

        connection.query('select 1', (err) => {
          assert.equal(err?.message, ERROR_TEXT);
          // @ts-expect-error: internal access
          server._server.close(() => {
            resolve();
          });
        });
      });
    });
  });
});

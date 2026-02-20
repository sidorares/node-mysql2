import type { Connection } from '../../../index.js';
import { assert, describe, it, skip } from 'poku';
import mysql from '../../../index.js';

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

await describe('Connect Connection Closed Error', async () => {
  const ERROR_TEXT = 'Connection lost: The server closed the connection.';

  await it('should return error when server closes connection', async () => {
    await new Promise<void>((resolve) => {
      // @ts-expect-error: TODO: implement typings
      const server = mysql.createServer();
      // @ts-expect-error: TODO: implement typings
      server.listen(0, () => {
        // @ts-expect-error: internal access
        const port = server._server.address().port;
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

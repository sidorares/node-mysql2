import type { Connection } from '../../../index.js';
import { describe, it, skip, strict } from 'poku';
import mysql from '../../../index.js';

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

await describe('Connect Time Error', async () => {
  const ERROR_TEXT = 'test error';

  await it('should return error from server', async () => {
    await new Promise<void>((resolve) => {
      // @ts-expect-error: TODO: implement typings
      const server = mysql.createServer();
      // @ts-expect-error: TODO: implement typings
      server.listen(0, () => {
        // @ts-expect-error: internal access
        const port = server._server.address().port;
        server.on('connection', (conn: Connection) => {
          conn.writeError(new Error(ERROR_TEXT));
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

        connection.query('select 1+1', (err) => {
          strict.equal(err?.message, ERROR_TEXT);
        });

        connection.query('select 1+2', (err) => {
          strict.equal(err?.message, ERROR_TEXT);
          // @ts-expect-error: TODO: implement typings
          connection.close();
          // @ts-expect-error: internal access
          server._server.close(() => {
            resolve();
          });
        });
      });
    });
  });
});

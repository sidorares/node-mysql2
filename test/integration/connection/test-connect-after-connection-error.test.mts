import type { Connection, QueryError } from '../../../index.js';
import { describe, it, skip, strict } from 'poku';
import mysql from '../../../index.js';

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

await describe('Connect After Connection Error', async () => {
  const ERROR_TEXT = 'Connection lost: The server closed the connection.';

  await it('should return error when connecting after server close', async () => {
    let connectError: QueryError | undefined;

    await new Promise<void>((resolve) => {
      // @ts-expect-error: TODO: implement typings
      const server = mysql.createServer();
      let serverConnection: Connection | undefined;
      // @ts-expect-error: TODO: implement typings
      server.listen(0, () => {
        // @ts-expect-error: internal access
        const port = server._server.address().port;
        server.on('connection', (conn: Connection) => {
          conn.serverHandshake({
            serverVersion: '5.6.10',
            capabilityFlags: 2181036031,
          });
          serverConnection = conn;
        });

        const clientConnection = mysql.createConnection({
          host: 'localhost',
          port: port,
          user: 'testuser',
          database: 'testdatabase',
          password: 'testpassword',
        });

        clientConnection.on('connect', () => {
          // @ts-expect-error: TODO: implement typings
          serverConnection.close();
        });

        clientConnection.once('error', () => {
          clientConnection.connect((err: QueryError | null) => {
            connectError = err ?? undefined;
            // @ts-expect-error: TODO: implement typings
            clientConnection.close();
            // @ts-expect-error: internal access
            server._server.close(() => {
              resolve();
            });
          });
        });
      });
    });

    strict.equal(connectError?.message, ERROR_TEXT);
  });
});

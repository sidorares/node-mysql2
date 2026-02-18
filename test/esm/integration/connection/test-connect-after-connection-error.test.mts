import type { Connection, QueryError } from '../../../../index.js';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import mysql from '../../../../index.js';

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

process.on('uncaughtException', (err: NodeJS.ErrnoException) => {
  if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'EPIPE') return;
  throw err;
});

await describe('Connect After Connection Error', async () => {
  const ERROR_TEXT = 'Connection lost: The server closed the connection.';

  await it('should return error when connecting after server close', async () => {
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
            assert.equal(err?.message, ERROR_TEXT);
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
  });
});

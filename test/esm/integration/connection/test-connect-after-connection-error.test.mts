import type { Connection, QueryError } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import portfinder from 'portfinder';
import mysql from '../../../../index.js';

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

const ERROR_TEXT = 'Connection lost: The server closed the connection.';

portfinder.getPort((_err: Error | null, port: number) => {
  // @ts-expect-error: TODO: implement typings
  const server = mysql.createServer();
  let serverConnection: Connection | undefined;
  server.listen(port);
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
      server._server.close();
    });
  });
});

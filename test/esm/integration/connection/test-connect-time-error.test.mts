import type { Connection } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import portfinder from 'portfinder';
import mysql from '../../../../index.js';

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

const ERROR_TEXT = 'test error';

portfinder.getPort((_err, port) => {
  // @ts-expect-error: TODO: implement typings
  const server = mysql.createServer();
  server.listen(port);
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
    assert.equal(err?.message, ERROR_TEXT);
  });

  connection.query('select 1+2', (err) => {
    assert.equal(err?.message, ERROR_TEXT);
    // @ts-expect-error: TODO: implement typings
    connection.close();
    // @ts-expect-error: internal access
    server._server.close();
  });
});

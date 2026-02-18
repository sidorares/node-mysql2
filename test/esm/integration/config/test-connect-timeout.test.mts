import assert from 'node:assert';
import process from 'node:process';
import portfinder from 'portfinder';
import mysql from '../../../../index.js';

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

console.log('test connect timeout');

portfinder.getPort((_, port) => {
  // @ts-expect-error: TODO: implement typings
  const server = mysql.createServer();
  server.on('connection', () => {
    // Let connection time out
  });

  server.listen(port);

  const connection = mysql.createConnection({
    host: 'localhost',
    port: port,
    connectTimeout: 1000,
  });

  connection.on('error', (err) => {
    assert.equal(err.code, 'ETIMEDOUT');
    connection.destroy();
    // @ts-expect-error: internal access
    server._server.close();
    console.log('ok');
  });
});

process.on('uncaughtException', (err: NodeJS.ErrnoException) => {
  assert.equal(
    err.message,
    'Connection lost: The server closed the connection.'
  );
  assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
});

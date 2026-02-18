import process from 'node:process';
import { assert } from 'poku';
import portfinder from 'portfinder';
import mysql from '../../../index.js';

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

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

let err1: NodeJS.ErrnoException | undefined,
  err2: NodeJS.ErrnoException | undefined;

portfinder.getPort((_err, port) => {
  server.listen(port);
  const conn = mysql.createConnection({
    user: 'test_user',
    password: 'test',
    database: 'test_database',
    port: port,
  });
  conn.on('error', (err) => {
    err1 = err;
  });

  const pool = mysql.createPool({
    user: 'test_user',
    password: 'test',
    database: 'test_database',
    port: port,
  });

  pool.query('test sql', (err) => {
    err2 = err ?? undefined;
    pool.end();
    // @ts-expect-error: TODO: implement typings
    server.close();
  });
});

process.on('exit', () => {
  assert.equal(err1?.errno, 1040);
  assert.equal(err2?.errno, 1040);
});

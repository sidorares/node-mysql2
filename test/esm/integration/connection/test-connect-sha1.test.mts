import type { Connection, QueryError } from '../../../../index.js';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { assert } from 'poku';
import portfinder from 'portfinder';
import mysql from '../../../../index.js';
import auth from '../../../../lib/auth_41.js';

type AuthParams = {
  authPluginData1: Buffer;
  authPluginData2: Buffer;
  authToken: Buffer;
};

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

function authenticate(params: AuthParams, cb: (err: Error | null) => void) {
  const doubleSha = auth.doubleSha1('testpassword');
  const isValid = auth.verifyToken(
    params.authPluginData1,
    params.authPluginData2,
    params.authToken,
    doubleSha
  );
  assert(isValid);
  cb(null);
}

let _1_2 = false;
let _1_3 = false;

let queryCalls = 0;

portfinder.getPort((_err, port) => {
  // @ts-expect-error: TODO: implement typings
  const server = mysql.createServer();
  server.listen(port);
  server.on('connection', (conn: Connection) => {
    conn.serverHandshake({
      protocolVersion: 10,
      serverVersion: 'node.js rocks',
      connectionId: 1234,
      statusFlags: 2,
      characterSet: 8,
      capabilityFlags: 0xffffff,
      authCallback: authenticate,
    });
    conn.on('query', (sql: string) => {
      assert.equal(sql, 'select 1+1');
      queryCalls++;
      // @ts-expect-error: TODO: implement typings
      conn.close();
    });
  });

  // @ts-expect-error: TODO: implement typings
  const connection = mysql.createConnection({
    port: port,
    user: 'testuser',
    database: 'testdatabase',
    passwordSha1: Buffer.from(
      '8bb6118f8fd6935ad0876a3be34a717d32708ffd',
      'hex'
    ),
  });

  connection.on('error', (err: QueryError) => {
    assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
  });

  connection.query('select 1+1', (err: QueryError | null) => {
    assert.equal(err?.code, 'PROTOCOL_CONNECTION_LOST');
    // @ts-expect-error: internal access
    server._server.close();
  });

  connection.query('select 1+2', (err: QueryError | null) => {
    assert.equal(err?.code, 'PROTOCOL_CONNECTION_LOST');
    _1_2 = true;
  });

  connection.query('select 1+3', (err: QueryError | null) => {
    assert.equal(err?.code, 'PROTOCOL_CONNECTION_LOST');
    _1_3 = true;
  });
});

process.on('exit', () => {
  assert.equal(queryCalls, 1);
  assert.equal(_1_2, true);
  assert.equal(_1_3, true);
});

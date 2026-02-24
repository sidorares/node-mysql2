import type { Connection, QueryError } from '../../../index.js';
import { Buffer } from 'node:buffer';
import { describe, it, skip, strict } from 'poku';
import mysql from '../../../index.js';
import auth from '../../../lib/auth_41.js';

type AuthParams = {
  authPluginData1: Buffer;
  authPluginData2: Buffer;
  authToken: Buffer;
};

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

function authenticate(params: AuthParams, cb: (err: Error | null) => void) {
  const doubleSha = auth.doubleSha1('testpassword');
  const isValid = auth.verifyToken(
    params.authPluginData1,
    params.authPluginData2,
    params.authToken,
    doubleSha
  );
  strict(isValid);
  cb(null);
}

await describe('Connect SHA1', async () => {
  await it('should authenticate with SHA1 password', async () => {
    let _1_2 = false;
    let _1_3 = false;
    let queryCalls = 0;
    let queryReceived: string | undefined;
    let queryError1Code: string | undefined;
    let queryError2Code: string | undefined;
    let queryError3Code: string | undefined;

    await new Promise<void>((resolve) => {
      // @ts-expect-error: TODO: implement typings
      const server = mysql.createServer();

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
          queryReceived = sql;
          queryCalls++;
          // @ts-expect-error: TODO: implement typings
          conn.close();
        });
      });

      // @ts-expect-error: TODO: implement typings
      server.listen(0, () => {
        // @ts-expect-error: internal access
        const port = server._server.address().port;

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
          strict.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
        });

        connection.query('select 1+1', (err: QueryError | null) => {
          queryError1Code = err?.code;
          // @ts-expect-error: internal access
          server._server.close();
        });

        connection.query('select 1+2', (err: QueryError | null) => {
          queryError2Code = err?.code;
          _1_2 = true;
        });

        connection.query('select 1+3', (err: QueryError | null) => {
          queryError3Code = err?.code;
          _1_3 = true;
          resolve();
        });
      });
    });

    strict.equal(queryReceived, 'select 1+1');
    strict.equal(queryError1Code, 'PROTOCOL_CONNECTION_LOST');
    strict.equal(queryError2Code, 'PROTOCOL_CONNECTION_LOST');
    strict.equal(queryError3Code, 'PROTOCOL_CONNECTION_LOST');
    strict.equal(queryCalls, 1);
    strict.equal(_1_2, true);
    strict.equal(_1_3, true);
  });
});

// This file was modified by Oracle on January 21, 2021.
// The connection with the mock server needs to happen in the same host where
// the tests are running in order to avoid connecting a potential MySQL server
// instance running in the host identified by the MYSQL_HOST environment
// variable.
// Modifications copyright (c) 2021, Oracle and/or its affiliates.

import process from 'node:process';
import { assert, describe, it } from 'poku';
import { createConnection, createServer } from '../../common.test.mjs';

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

const queryCli = 'SELECT 1';

await describe('Quit', async () => {
  await it('should send COM_QUIT and receive quit event on server', async () => {
    let quitReceived: boolean;
    let queryServ: string;
    let rows: Array<Record<string, unknown>>;
    let fields: Array<{ name: string }>;

    await new Promise<void>((resolve) => {
      const server = createServer(
        () => {
          const connection = createConnection({
            // The mock server is running on the same host machine.
            // We need to explicitly define the host to avoid connecting to a potential
            // different host provided via MYSQL_HOST that identifies a real MySQL
            // server instance.
            host: 'localhost',
            // @ts-expect-error: internal access
            port: server._port,
            // @ts-expect-error: TODO: implement typings
            ssl: false,
          });

          connection.query(queryCli, (err, _rows, _fields) => {
            if (err) return;
            rows = _rows as Array<Record<string, unknown>>;
            fields = _fields as Array<{ name: string }>;

            connection.end();
          });
        },
        (conn) => {
          conn.on('quit', () => {
            // COM_QUIT
            quitReceived = true;
            // @ts-expect-error: TODO: implement typings
            conn.stream.end();
            // @ts-expect-error: TODO: implement typings
            server.close();
            resolve();
          });

          conn.on('query', (q: string) => {
            queryServ = q;
            conn.writeTextResult(
              [{ 1: '1' }],
              [
                {
                  catalog: 'def',
                  schema: '',
                  table: '',
                  orgTable: '',
                  name: '1',
                  orgName: '',
                  characterSet: 63,
                  columnLength: 1,
                  columnType: 8,
                  flags: 129,
                  decimals: 0,
                },
              ]
            );
          });
        }
      );
    });

    assert.deepEqual(rows!, [{ 1: 1 }]);
    assert.equal(fields![0].name, '1');
    assert.equal(quitReceived!, true);
    assert.equal(queryCli, queryServ!);
  });
});

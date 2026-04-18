// This file was modified by Oracle on January 21, 2021.
// The connection with the mock server needs to happen in the same host where
// the tests are running in order to avoid connecting a potential MySQL server
// instance running in the host identified by the MYSQL_HOST environment
// variable.
// Modifications copyright (c) 2021, Oracle and/or its affiliates.

import type { FieldPacket, RowDataPacket } from '../../../index.js';
import { describe, it, skip, strict } from 'poku';
import { createConnection, createServer } from '../../common.test.mjs';

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

const query = 'SELECT 1';

await describe('Protocol Errors', async () => {
  await it('should handle unexpected packet errors', async () => {
    let fields: FieldPacket[];
    let error: Error & { fatal?: boolean; code?: string };
    let rows: RowDataPacket[];

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
          connection.query<RowDataPacket[]>(query, (err, _rows, _fields) => {
            if (err) return;
            rows = _rows;
            fields = _fields;
          });

          connection.on('error', (err) => {
            error = err;
            // @ts-expect-error: internal access
            if (server._server._handle) {
              // @ts-expect-error: TODO: implement typings
              server.close();
            }
            resolve();
          });
        },
        (conn) => {
          conn.on('query', () => {
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
            // this is extra (incorrect) packet - client should emit error on receiving it
            conn.writeOk();
          });
        }
      );
    });

    strict.deepEqual(rows!, [{ 1: 1 }]);
    strict.equal(fields![0].name, '1');
    strict.equal(
      error!.message,
      'Unexpected packet while no commands in the queue'
    );
    strict.equal(error!.fatal, true);
    strict.equal(error!.code, 'PROTOCOL_UNEXPECTED_PACKET');
  });
});

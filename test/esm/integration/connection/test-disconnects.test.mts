// This file was modified by Oracle on January 21, 2021.
// The connection with the mock server needs to happen in the same host where
// the tests are running in order to avoid connecting a potential MySQL server
// instance running in the host identified by the MYSQL_HOST environment
// variable.
// Modifications copyright (c) 2021, Oracle and/or its affiliates.

import type {
  Connection,
  FieldPacket,
  RowDataPacket,
} from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection, createServer } from '../../common.test.mjs';

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

let rows: RowDataPacket[] | undefined;
let fields: FieldPacket[] | undefined;

const connections: Connection[] = [];

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
    connection.query<RowDataPacket[]>('SELECT 123', (err, _rows, _fields) => {
      if (err) {
        throw err;
      }

      rows = _rows;
      fields = _fields;
      connection.on('error', (_err) => {
        err = _err;
      });

      connections.forEach((conn) => {
        // @ts-expect-error: TODO: implement typings
        conn.stream.end();
      });
      // @ts-expect-error: internal access
      server._server.close(() => {
        assert.equal(err?.code, 'PROTOCOL_CONNECTION_LOST');
      });
    });
    // TODO: test connection.end() etc where we expect disconnect to happen
  },
  (conn) => {
    connections.push(conn);
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
            type: 8,
            flags: 129,
            decimals: 0,
          },
        ]
      );
    });
  }
);

process.on('exit', () => {
  assert.deepEqual(rows, [{ 1: 1 }]);
  assert.equal(fields?.[0].name, '1');
});

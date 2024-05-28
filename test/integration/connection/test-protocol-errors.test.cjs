// This file was modified by Oracle on January 21, 2021.
// The connection with the mock server needs to happen in the same host where
// the tests are running in order to avoid connecting a potential MySQL server
// instance running in the host identified by the MYSQL_HOST environment
// variable.
// Modifications copyright (c) 2021, Oracle and/or its affiliates.

'use strict';

const { assert } = require('poku');
const common = require('../../common.test.cjs');
const process = require('node:process');

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

let fields, error;
const query = 'SELECT 1';
let rows;

const server = common.createServer(
  () => {
    const connection = common.createConnection({
      // The mock server is running on the same host machine.
      // We need to explicitly define the host to avoid connecting to a potential
      // different host provided via MYSQL_HOST that identifies a real MySQL
      // server instance.
      host: 'localhost',
      port: server._port,
      ssl: false,
    });
    connection.query(query, (err, _rows, _fields) => {
      if (err) {
        throw err;
      }
      rows = _rows;
      fields = _fields;
    });

    connection.on('error', (err) => {
      error = err;
      if (server._server._handle) {
        server.close();
      }
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
        ],
      );
      // this is extra (incorrect) packet - client should emit error on receiving it
      conn.writeOk();
    });
  },
);

process.on('exit', () => {
  assert.deepEqual(rows, [{ 1: 1 }]);
  assert.equal(fields[0].name, '1');
  assert.equal(
    error.message,
    'Unexpected packet while no commands in the queue',
  );
  assert.equal(error.fatal, true);
  assert.equal(error.code, 'PROTOCOL_UNEXPECTED_PACKET');
});

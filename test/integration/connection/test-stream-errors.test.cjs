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

let clientConnection;
const err = new Error('This socket has been ended by the other party');
err.code = 'EPIPE';

let receivedError1, receivedError2, receivedError3;
const query = 'SELECT 1';

const server = common.createServer(
  () => {
    clientConnection = common.createConnection({
      // The mock server is running on the same host machine.
      // We need to explicitly define the host to avoid connecting to a potential
      // different host provided via MYSQL_HOST that identifies a real MySQL
      // server instance.
      host: 'localhost',
      port: server._port,
      ssl: false,
    });
    clientConnection.query(query, (err) => {
      if (err && err.code === 'HANDSHAKE_NO_SSL_SUPPORT') {
        clientConnection.end();
      }
      receivedError1 = err;
    });
    clientConnection.query('second query, should not be executed', () => {
      receivedError2 = err;
      clientConnection.query(
        'trying to enqueue command to a connection which is already in error state',
        (err1) => {
          receivedError3 = err1;
        },
      );
    });
  },
  (conn) => {
    conn.on('query', () => {
      conn.writeColumns([
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
      ]);
      // emulate  stream error here
      clientConnection.stream.emit('error', err);
      clientConnection.stream.end();
      server.close();
    });
  },
);

process.on('exit', () => {
  assert.equal(receivedError1.fatal, true);
  assert.equal(receivedError1.code, err.code);
  assert.equal(receivedError2.fatal, true);
  assert.equal(receivedError2.code, err.code);
  assert.equal(receivedError3.fatal, true);
  assert.equal(
    receivedError3.message,
    "Can't add new command when connection is in closed state",
  );
});

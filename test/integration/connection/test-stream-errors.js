'use strict';

const assert = require('assert');
const common = require('../../common');

let clientConnection;
const err = new Error('This socket has been ended by the other party');
err.code = 'EPIPE';

let receivedError1, receivedError2, receivedError3;
const query = 'SELECT 1';

const server = common.createServer(
  () => {
    clientConnection = common.createConnection({ port: server._port });
    clientConnection.query(query, err => {
      receivedError1 = err;
    });
    clientConnection.query('second query, should not be executed', () => {
      receivedError2 = err;
      clientConnection.query(
        'trying to enqueue command to a connection which is already in error state',
        err1 => {
          receivedError3 = err1;
        }
      );
    });
  },
  conn => {
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
          decimals: 0
        }
      ]);
      // emulate  stream error here
      clientConnection.stream.emit('error', err);
      clientConnection.stream.end();
      server.close();
    });
  }
);

process.on('exit', () => {
  assert.equal(receivedError1.fatal, true);
  assert.equal(receivedError1.code, err.code);
  assert.equal(receivedError2.fatal, true);
  assert.equal(receivedError2.code, err.code);
  assert.equal(receivedError3.fatal, true);
  assert.equal(
    receivedError3.message,
    "Can't add new command when connection is in closed state"
  );
});

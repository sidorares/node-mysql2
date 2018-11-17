'use strict';

const assert = require('assert');
const common = require('../../common');

let fields, error;
const query = 'SELECT 1';
let rows;

const server = common.createServer(
  () => {
    const connection = common.createConnection({ port: server._port });
    connection.query(query, (err, _rows, _fields) => {
      if (err) {
        throw err;
      }
      rows = _rows;
      fields = _fields;
    });

    connection.on('error', err => {
      error = err;
      if (server._server._handle) {
        server.close();
      }
    });
  },
  conn => {
    conn.on('query', () => {
      conn.writeTextResult(
        [{ '1': '1' }],
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
            decimals: 0
          }
        ]
      );
      // this is extra (incorrect) packet - client should emit error on receiving it
      conn.writeOk();
    });
  }
);

process.on('exit', () => {
  assert.deepEqual(rows, [{ 1: 1 }]);
  assert.equal(fields[0].name, '1');
  assert.equal(
    error.message,
    'Unexpected packet while no commands in the queue'
  );
  assert.equal(error.fatal, true);
  assert.equal(error.code, 'PROTOCOL_UNEXPECTED_PACKET');
});

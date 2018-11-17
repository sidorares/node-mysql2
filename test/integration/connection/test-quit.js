'use strict';

const assert = require('assert');
const common = require('../../common');
let quitReceived = false;
const queryCli = 'SELECT 1';
let queryServ;
let rows;
let fields;
const server = common.createServer(
  () => {
    const connection = common.createConnection({ port: server._port });

    connection.query(queryCli, (err, _rows, _fields) => {
      if (err) {
        throw err;
      }
      rows = _rows;
      fields = _fields;

      connection.end();
    });
  },
  conn => {
    conn.on('quit', () => {
      // COM_QUIT
      quitReceived = true;
      conn.stream.end();
      server.close();
    });

    conn.on('query', q => {
      queryServ = q;
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
    });
  }
);

process.on('exit', () => {
  assert.deepEqual(rows, [{ 1: 1 }]);
  assert.equal(fields[0].name, '1');
  assert.equal(quitReceived, true);
  assert.equal(queryCli, queryServ);
});

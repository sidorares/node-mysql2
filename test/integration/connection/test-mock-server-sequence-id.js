'use strict';

const assert = require('assert');
const common = require('../../common');
const results = [];
const server = common.createServer(
  () => {
    const connection = common.createConnection({ port: server._port });

    function addResult(err, rows) {
      if (err) {
        throw err;
      }
      results.push(rows[0]);
    }

    connection.query('SELECT 1', (err, rows) => {
      addResult(err, rows);
      connection.query('SELECT 2', (err, rows) => {
        addResult(err, rows);
        connection.query('SELECT 3', (err, rows) => {
          addResult(err, rows);
          connection.end();
        });
      });
    });
  },
  (conn) => {
    conn.on('quit', () => {
      // COM_QUIT
      conn.stream.end();
      server.close();
    });

    conn.on('query', (q) => {
      const d = q.match(/SELECT (\d+)/);
      const req = d[1];
      const seq = String(conn.sequenceId);
      conn.writeTextResult(
        [{ req, seq }],
        [
          {
            catalog: 'def',
            schema: '',
            table: '',
            orgTable: '',
            name: 'req',
            orgName: '',
            characterSet: 63,
            columnLength: 1,
            columnType: 8,
            flags: 129,
            decimals: 0
          },
          {
            catalog: 'def',
            schema: '',
            table: '',
            orgTable: '',
            name: 'seq',
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

    conn.on('warn', (err) => {
      assert.fail(err);
    });
  }
);

process.on('exit', () => {
  assert.deepEqual(results, [
    // for each query/command the sequence-id must start from 1
    { req: 1, seq: 1 },
    { req: 2, seq: 1 },
    { req: 3, seq: 1 }
  ]);
});

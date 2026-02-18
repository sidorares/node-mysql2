import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

const connection = createConnection();

let rowsTextProtocol: RowDataPacket[];
let rowsBinaryProtocol: RowDataPacket[];

connection.query('CREATE TEMPORARY TABLE binary_table (stuff BINARY(16));');
connection.query('INSERT INTO binary_table VALUES(null)');

connection.query<RowDataPacket[]>(
  'SELECT * from binary_table',
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rowsTextProtocol = _rows;
    connection.execute<RowDataPacket[]>(
      'SELECT * from binary_table',
      (err, _rows) => {
        if (err) {
          throw err;
        }
        rowsBinaryProtocol = _rows;
        connection.end();
      }
    );
  }
);

process.on('exit', () => {
  assert.deepEqual(rowsTextProtocol[0], { stuff: null });
  assert.deepEqual(rowsBinaryProtocol[0], { stuff: null });
});

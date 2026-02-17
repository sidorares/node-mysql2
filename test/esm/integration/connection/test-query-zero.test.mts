import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

const connection = createConnection();

let rows: RowDataPacket[];
connection.query<RowDataPacket[]>('SELECT ? AS result', 0, (err, _rows) => {
  if (err) {
    throw err;
  }
  rows = _rows;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ result: 0 }]);
});

import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

const connection = createConnection();

let rows: RowDataPacket[] = [];
let rows1: RowDataPacket[] = [];

connection.execute<RowDataPacket[]>('SELECT -1 v', [], (err, _rows) => {
  if (err) {
    throw err;
  }
  rows = _rows;
});

connection.query<RowDataPacket[]>('SELECT -1 v', (err, _rows) => {
  if (err) {
    throw err;
  }
  rows1 = _rows;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ v: -1 }]);
  assert.deepEqual(rows1, [{ v: -1 }]);
});

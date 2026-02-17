import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

const connection = createConnection();

let rows: RowDataPacket[];
connection.execute<RowDataPacket[]>(
  'SELECT ? AS firstValue, ? AS nullValue, ? AS lastValue',
  ['foo', null, 'bar'],
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows = _rows;
    connection.end();
  }
);

process.on('exit', () => {
  assert.deepEqual(rows, [
    { firstValue: 'foo', nullValue: null, lastValue: 'bar' },
  ]);
});

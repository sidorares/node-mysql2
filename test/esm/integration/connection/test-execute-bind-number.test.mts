import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

const connection = createConnection();

let rows: RowDataPacket[];
connection.execute<RowDataPacket[]>(
  'SELECT ? AS zeroValue, ? AS positiveValue, ? AS negativeValue, ? AS decimalValue',
  [0, 123, -123, 1.25],
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
    {
      zeroValue: 0,
      positiveValue: 123,
      negativeValue: -123,
      decimalValue: 1.25,
    },
  ]);
});

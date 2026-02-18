import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

const connection = createConnection();
const date = new Date(2018, 2, 10, 15, 12, 34, 1234);

let rows: RowDataPacket[];
connection.execute<RowDataPacket[]>(
  'SELECT CAST(? AS DATETIME(6)) AS result',
  [date],
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows = _rows;
    connection.end();
  }
);

process.on('exit', () => {
  assert.deepEqual(rows, [{ result: date }]);
});

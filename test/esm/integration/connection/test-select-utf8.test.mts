import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

const connection = createConnection();

let rows: RowDataPacket[] = [];
const multibyteText = '本日は晴天なり';
connection.query<RowDataPacket[]>(
  `SELECT '${multibyteText}' as result`,
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows = _rows;
    connection.end();
  }
);

process.on('exit', () => {
  assert.equal(rows[0].result, multibyteText);
});

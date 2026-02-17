import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

const connection = createConnection({ timezone: 'Z' });

let rows: RowDataPacket[] | undefined = undefined;

connection.query("set time_zone = '+00:00'");
connection.execute<RowDataPacket[]>(
  'SELECT UNIX_TIMESTAMP(?) t',
  [new Date('1990-01-01 UTC')],
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows = _rows;
    connection.end();
  }
);

process.on('exit', () => {
  assert.deepEqual(rows, [{ t: 631152000 }]);
});

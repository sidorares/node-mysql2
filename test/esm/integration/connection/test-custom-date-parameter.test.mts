import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

const connection = createConnection({ timezone: 'Z' });

let rows: RowDataPacket[] | undefined = undefined;

// @ts-expect-error: intentionally replacing global Date for testing
// eslint-disable-next-line no-global-assign
Date = (function () {
  const NativeDate = Date;
  function CustomDate(str: string) {
    return new NativeDate(str);
  }
  CustomDate.now = Date.now;
  return CustomDate;
})();

connection.query("set time_zone = '+00:00'");
connection.execute<RowDataPacket[]>(
  'SELECT UNIX_TIMESTAMP(?) t',
  [new Date('1990-08-08 UTC')],
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows = _rows;
    connection.end();
  }
);

process.on('exit', () => {
  assert.equal(rows?.[0].t, 650073600);
});

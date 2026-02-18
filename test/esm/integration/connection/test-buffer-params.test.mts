import type { QueryError, RowDataPacket } from '../../../../index.js';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

type BufRow = RowDataPacket & { buf: string };

const connection = createConnection();

let rows: BufRow[] | undefined = undefined;
let rows1: BufRow[] | undefined = undefined;

const buf = Buffer.from([
  0x80, 0x90, 1, 2, 3, 4, 5, 6, 7, 8, 9, 100, 100, 255, 255,
]);
connection.execute<BufRow[]>(
  'SELECT HEX(?) as buf',
  [buf],
  (err: QueryError | null, _rows) => {
    if (err) {
      throw err;
    }
    rows = _rows;
  }
);

connection.query<BufRow[]>(
  'SELECT HEX(?) as buf',
  [buf],
  (err: QueryError | null, _rows) => {
    if (err) {
      throw err;
    }
    rows1 = _rows;
    connection.end();
  }
);

process.on('exit', () => {
  assert.deepEqual(rows, [{ buf: buf.toString('hex').toUpperCase() }]);
  assert.deepEqual(rows1, [{ buf: buf.toString('hex').toUpperCase() }]);
});

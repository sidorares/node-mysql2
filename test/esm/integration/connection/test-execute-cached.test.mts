import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

type TestRow = RowDataPacket & { test: number };

const connection = createConnection();

let rows: TestRow[] | undefined = undefined;
let rows1: TestRow[] | undefined = undefined;
let rows2: TestRow[] | undefined = undefined;

const q = 'select 1 + ? as test';
const key = `undefined/undefined/undefined${q}`;

connection.execute<TestRow[]>(q, [123], (err, _rows) => {
  if (err) {
    throw err;
  }
  rows = _rows;
  connection.execute<TestRow[]>(q, [124], (err, _rows) => {
    if (err) {
      throw err;
    }
    rows1 = _rows;
    connection.execute<TestRow[]>(q, [125], (err, _rows) => {
      if (err) {
        throw err;
      }
      rows2 = _rows;
      // @ts-expect-error: internal access
      assert(connection._statements.size === 1);
      // @ts-expect-error: internal access
      assert(connection._statements.get(key).query === q);
      // @ts-expect-error: internal access
      assert(connection._statements.get(key).parameters.length === 1);
      connection.end();
    });
  });
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ test: 124 }]);
  assert.deepEqual(rows1, [{ test: 125 }]);
  assert.deepEqual(rows2, [{ test: 126 }]);
});

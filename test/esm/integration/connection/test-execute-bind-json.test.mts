import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

const connection = createConnection();
const table = 'jsontable';
const testJson = [{ a: 1, b: true, c: ['foo'] }];

let rows: RowDataPacket[];
connection.query(`CREATE TEMPORARY TABLE ${table} (data JSON)`);
connection.query(
  `INSERT INTO ${table} (data) VALUES ('${JSON.stringify(testJson)}')`
);
connection.execute<RowDataPacket[]>(`SELECT * from ${table}`, (err, _rows) => {
  if (err) {
    throw err;
  }
  rows = _rows;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ data: testJson }]);
});

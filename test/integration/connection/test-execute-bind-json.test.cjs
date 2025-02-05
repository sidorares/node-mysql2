'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();
const table = 'jsontable';
const testJson = [{ a: 1, b: true, c: ['foo'] }];

let rows;
connection.query(`CREATE TEMPORARY TABLE ${table} (data JSON)`);
connection.query(
  `INSERT INTO ${table} (data) VALUES ('${JSON.stringify(testJson)}')`,
);
connection.execute(`SELECT * from ${table}`, (err, _rows) => {
  if (err) {
    throw err;
  }
  rows = _rows;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ data: testJson }]);
});

'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();

let rows = undefined;

connection.query(
  'CREATE TEMPORARY TABLE signed_ints  (b11 tinyint NOT NULL, b12 tinyint NOT NULL, b21 smallint NOT NULL)',
);
connection.query('INSERT INTO signed_ints values (-3, -120, 500)');
connection.query('INSERT INTO signed_ints values (3,  -110, -500)');

connection.execute('SELECT * from signed_ints', [5], (err, _rows) => {
  if (err) {
    throw err;
  }
  rows = _rows;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows, [
    { b11: -3, b12: -120, b21: 500 },
    { b11: 3, b12: -110, b21: -500 },
  ]);
});

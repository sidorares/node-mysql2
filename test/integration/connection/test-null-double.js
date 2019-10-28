'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let rows;

connection.query('CREATE TEMPORARY TABLE t (i int)');
connection.query('INSERT INTO t VALUES(null)');
connection.query('INSERT INTO t VALUES(123)');

connection.query('SELECT * from t', (err, _rows) => {
  if (err) {
    throw err;
  }
  rows = _rows;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows[0], { i: null });
  assert.deepEqual(rows[1], { i: 123 });
});

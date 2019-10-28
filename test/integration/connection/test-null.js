'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let rows, rows1;
let fields, fields1;

connection.query('CREATE TEMPORARY TABLE t (i int)');
connection.query('INSERT INTO t VALUES(null)');
connection.query('SELECT cast(NULL AS CHAR)', (err, _rows, _fields) => {
  if (err) {
    throw err;
  }
  rows = _rows;
  fields = _fields;
});
connection.query('SELECT * from t', (err, _rows, _fields) => {
  if (err) {
    throw err;
  }
  rows1 = _rows;
  fields1 = _fields;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ 'cast(NULL AS CHAR)': null }]);
  assert.equal(fields[0].columnType, 253);
  assert.deepEqual(rows1, [{ i: null }]);
  assert.equal(fields1[0].columnType, 3);
});

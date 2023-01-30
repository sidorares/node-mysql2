'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let rows, rows1;
let fields1;

connection.query('CREATE TEMPORARY TABLE t (i int)');
connection.query('INSERT INTO t VALUES(null)');
connection.query('SELECT cast(NULL AS CHAR) as cast_result', (err, _rows) => {
  if (err) {
    throw err;
  }
  rows = _rows;
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
  assert.deepEqual(rows, [{ 'cast_result': null }]);
  // assert.equal(fields[0].columnType, 253); // depeding on the server type could be 253 or 3, disabling this check for now
  assert.deepEqual(rows1, [{ i: null }]);
  assert.equal(fields1[0].columnType, 3);
});

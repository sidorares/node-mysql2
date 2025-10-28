'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();

connection.query('CREATE TEMPORARY TABLE t (f DECIMAL(19,4))');
connection.query('INSERT INTO t VALUES(12345.67)');

let rows, fields;
connection.execute('SELECT f FROM t', (err, _rows, _fields) => {
  if (err) {
    throw err;
  }
  rows = _rows;
  fields = _fields;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ f: '12345.6700' }]);
  assert.equal(fields[0].name, 'f');
});

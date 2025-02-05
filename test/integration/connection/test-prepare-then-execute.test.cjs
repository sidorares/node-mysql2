'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();

let _stmt = null;
let _columns = null;
let _rows = null;

connection.prepare('select 1 + ? + ? as test', (err, stmt) => {
  if (err) {
    throw err;
  }
  _stmt = stmt;
  stmt.execute([111, 123], (err, rows, columns) => {
    if (err) {
      throw err;
    }
    _columns = columns;
    _rows = rows;
    connection.end();
  });
});

process.on('exit', () => {
  assert.equal(_stmt.columns.length, 1);
  assert.equal(_stmt.parameters.length, 2);
  assert.deepEqual(_rows, [{ test: 235 }]);
  assert.equal(_columns[0].name, 'test');
});

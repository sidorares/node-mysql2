'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();

let rows = undefined;
let rows1 = undefined;

connection.execute('SELECT -1 v', [], (err, _rows) => {
  if (err) {
    throw err;
  }
  rows = _rows;
});

connection.query('SELECT -1 v', (err, _rows) => {
  if (err) {
    throw err;
  }
  rows1 = _rows;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ v: -1 }]);
  assert.deepEqual(rows1, [{ v: -1 }]);
});

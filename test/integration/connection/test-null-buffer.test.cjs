'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();

let rowsTextProtocol;
let rowsBinaryProtocol;

connection.query('CREATE TEMPORARY TABLE binary_table (stuff BINARY(16));');
connection.query('INSERT INTO binary_table VALUES(null)');

connection.query('SELECT * from binary_table', (err, _rows) => {
  if (err) {
    throw err;
  }
  rowsTextProtocol = _rows;
  connection.execute('SELECT * from binary_table', (err, _rows) => {
    if (err) {
      throw err;
    }
    rowsBinaryProtocol = _rows;
    connection.end();
  });
});

process.on('exit', () => {
  assert.deepEqual(rowsTextProtocol[0], { stuff: null });
  assert.deepEqual(rowsBinaryProtocol[0], { stuff: null });
});

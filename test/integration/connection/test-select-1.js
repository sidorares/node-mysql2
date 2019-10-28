'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let rows = undefined;
let fields = undefined;
connection.query('SELECT 1', (err, _rows, _fields) => {
  if (err) {
    throw err;
  }

  rows = _rows;
  fields = _fields;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ 1: 1 }]);
  assert.equal(fields[0].name, '1');
});

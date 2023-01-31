'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let rows, fields;
connection.query('SELECT ""', (err, _rows, _fields) => {
  if (err) {
    throw err;
  }

  rows = _rows;
  fields = _fields;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ [fields[0].name]: '' }]);
});

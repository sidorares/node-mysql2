'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let rows;
connection.query('SELECT ""', (err, _rows) => {
  if (err) {
    throw err;
  }

  rows = _rows;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ '': '' }]);
});

'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let rows;
connection.query('SELECT ""', function(err, _rows) {
  if (err) {
    throw err;
  }

  rows = _rows;
  connection.end();
});

process.on('exit', function() {
  assert.deepEqual(rows, [{ '': '' }]);
});

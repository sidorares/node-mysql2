'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let rows;
connection.execute(
  'SELECT ? AS firstValue, ? AS nullValue, ? AS lastValue',
  ['foo', null, 'bar'],
  function(err, _rows) {
    if (err) {
      throw err;
    }
    rows = _rows;
    connection.end();
  }
);

process.on('exit', function() {
  assert.deepEqual(rows, [
    { firstValue: 'foo', nullValue: null, lastValue: 'bar' }
  ]);
});

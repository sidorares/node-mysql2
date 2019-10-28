'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let rows;
connection.execute(
  'SELECT ? AS zeroValue, ? AS positiveValue, ? AS negativeValue, ? AS decimalValue',
  [0, 123, -123, 1.25],
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows = _rows;
    connection.end();
  }
);

process.on('exit', () => {
  assert.deepEqual(rows, [
    {
      zeroValue: 0,
      positiveValue: 123,
      negativeValue: -123,
      decimalValue: 1.25
    }
  ]);
});

'use strict';

const common = require('../../common.test.cjs');
const connection = common.createConnection();
const { assert } = require('poku');

let rows;
connection.execute(
  'SELECT ? AS trueValue, ? AS falseValue',
  [true, false],
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows = _rows;
    connection.end();
  },
);

process.on('exit', () => {
  assert.deepEqual(rows, [{ trueValue: 1, falseValue: 0 }]);
});

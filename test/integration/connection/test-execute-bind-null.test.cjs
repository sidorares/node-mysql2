'use strict';

const common = require('../../common.test.cjs');
const connection = common.createConnection();
const { assert } = require('poku');

let rows;
connection.execute(
  'SELECT ? AS firstValue, ? AS nullValue, ? AS lastValue',
  ['foo', null, 'bar'],
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows = _rows;
    connection.end();
  },
);

process.on('exit', () => {
  assert.deepEqual(rows, [
    { firstValue: 'foo', nullValue: null, lastValue: 'bar' },
  ]);
});

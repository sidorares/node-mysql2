'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let rows;
connection.execute(
  'SELECT ? AS result',
  [{ a: 1, b: true, c: ['foo'] }],
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows = _rows;
    connection.end();
  }
);

process.on('exit', () => {
  assert.deepEqual(rows, [{ result: { a: 1, b: true, c: ['foo'] } }]);
});

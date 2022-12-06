'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

const date = new Date(2018, 2, 10, 15, 12, 34, 1234);

let rows;
connection.execute('SELECT CAST(? AS DATETIME(6)) AS result', [date], (err, _rows) => {
  if (err) {
    throw err;
  }
  rows = _rows;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ result: date }]);
});

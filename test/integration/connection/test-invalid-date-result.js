'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let rows = undefined;

connection.execute('SELECT TIMESTAMP(0000-00-00) t', [], (err, _rows) => {
  if (err) {
    throw err;
  }
  rows = _rows;
  connection.end();
});

function isInvalidTime(t) {
  return isNaN(t.getTime());
}

process.on('exit', () => {
  assert.deepEqual(Object.prototype.toString.call(rows[0].t), '[object Date]');
  assert.deepEqual(isInvalidTime(rows[0].t), true);
});

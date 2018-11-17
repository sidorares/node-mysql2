'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let rows = undefined;

connection.query("set time_zone = '+00:00'");
connection.execute(
  'SELECT UNIX_TIMESTAMP(?) t',
  [new Date('1990-01-01 UTC')],
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows = _rows;
    connection.end();
  }
);

process.on('exit', () => {
  assert.deepEqual(rows, [{ t: 631152000 }]);
});

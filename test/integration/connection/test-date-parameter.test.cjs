'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection({ timezone: 'Z' });

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
  },
);

process.on('exit', () => {
  assert.deepEqual(rows, [{ t: 631152000 }]);
});

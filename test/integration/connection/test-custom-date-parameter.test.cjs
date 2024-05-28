'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection({ timezone: 'Z' });

let rows = undefined;

// eslint-disable-next-line no-global-assign
Date = (function () {
  const NativeDate = Date;
  function CustomDate(str) {
    return new NativeDate(str);
  }
  CustomDate.now = Date.now;
  return CustomDate;
})();

connection.query("set time_zone = '+00:00'");
connection.execute(
  'SELECT UNIX_TIMESTAMP(?) t',
  [new Date('1990-08-08 UTC')],
  (err, _rows) => {
    if (err) {
      throw err;
    }
    rows = _rows;
    connection.end();
  },
);

process.on('exit', () => {
  assert.equal(rows[0].t, 650073600);
});

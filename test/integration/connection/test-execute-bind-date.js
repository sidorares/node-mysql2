'use strict';

process.env.TZ = 'UTC';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

const date = new Date(2018, 2, 10, 15, 12, 34, 1234);

let rows;
connection.execute(`SET @@session.time_zone = '+00:00'`);
connection.execute(`SELECT DATE_FORMAT(?, '%Y-%m-%dT%H:%i:%sZ') AS result`, [date], (err, _rows) => {
  if (err) {
    throw err;
  }
  rows = _rows;
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(rows, [{ result: date.toISOString().replace('.234Z', 'Z') }]);
});

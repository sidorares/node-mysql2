'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let rows = undefined;
const multibyteText = '本日は晴天なり';
connection.query(`SELECT '${multibyteText}' as result`, (err, _rows) => {
  if (err) {
    throw err;
  }
  rows = _rows;
  connection.end();
});

process.on('exit', () => {
  assert.equal(rows[0].result, multibyteText);
});

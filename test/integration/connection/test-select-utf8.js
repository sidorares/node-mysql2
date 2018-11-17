'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

let rows = undefined;
let fields = undefined;
const multibyteText = '本日は晴天なり';
connection.query("SELECT '" + multibyteText + "'", (err, _rows, _fields) => {
  if (err) {
    throw err;
  }
  rows = _rows;
  fields = _fields;
  connection.end();
});

process.on('exit', () => {
  assert.equal(rows[0][multibyteText], multibyteText);
  assert.equal(fields[0].name, multibyteText);
});

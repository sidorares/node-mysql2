'use strict';

const assert = require('assert');
const common = require('../../common');
const connection = common.createConnection();

connection.query('SELECT 1', (err, rows, fields) => {
  console.log('query callback', err, rows, fields);
  assert.ifError(err);
  assert.deepEqual(rows, [{ 1: 1 }]);
  assert.equal(fields[0].name, '1');
  connection.end();
});
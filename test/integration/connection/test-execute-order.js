'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

const order = [];
connection.execute('select 1+2', err => {
  assert.ifError(err);
  order.push(0);
});
connection.execute('select 2+2', err => {
  assert.ifError(err);
  order.push(1);
});
connection.query('select 1+1', err => {
  assert.ifError(err);
  order.push(2);
  connection.end();
});

process.on('exit', () => {
  assert.deepEqual(order, [0, 1, 2]);
});

var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

var order = [];
connection.execute('select 1+2', function (err, _rows, _fields) {
  assert.ifError(err);
  order.push(0);
});
connection.execute('select 2+2', function (err, _rows, _fields) {
  assert.ifError(err);
  order.push(1);
});
connection.query('select 1+1', function (err, _rows, _fields) {
  assert.ifError(err);
  order.push(2);
  connection.end();
});

process.on('exit', function () {
  assert.deepEqual(order, [0, 1, 2]);
});

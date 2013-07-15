var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var rows = undefined;
var rows1 = undefined;
var fields = undefined;
connection.execute('SELECT 1+? as test', [123], function(err, _rows, _fields) {
  if (err) throw err;

  rows = _rows;
  fields = _fields;
});
connection.execute('SELECT 1 as test', function(err, _rows, _fields) {
  if (err) throw err;

  rows1 = _rows;
  fields = _fields;
});

connection.end();

process.on('exit', function() {
  assert.deepEqual(rows, [{'test': 124}]);
  assert.deepEqual(rows1, [{'test': 1}]);
  assert.equal(fields[0].name, 'test');
});

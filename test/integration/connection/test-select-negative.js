var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var rows = undefined;
var rows1 = undefined;
var fields = undefined;
var fields1 = undefined;

connection.execute('SELECT -1 v', [], function(err, _rows, _fields) {
  if (err) throw err;
  rows = _rows;
  fields = _fields;
});

connection.query('SELECT -1 v', function(err, _rows, _fields) {
  if (err) throw err;
  rows1 = _rows;
  fields1 = _fields;
  connection.end();
});

process.on('exit', function() {
  assert.deepEqual(rows, [{v: -1}]);
  assert.deepEqual(rows1, [{v: -1}]);
});

var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var rows = undefined;
var fields = undefined;
connection.execute('SELECT 1+? as test', [5], function(err, _rows, _fields) {
  if (err) throw err;

  rows = _rows;
  fields = _fields;
});

connection.end();

process.on('exit', function() {
  assert.deepEqual(rows, [{'test': 6}]);
  assert.equal(fields[0].name, 'test');
});

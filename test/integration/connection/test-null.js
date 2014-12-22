var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var rows, rows1;
var fields, fields1;

connection.query('CREATE TEMPORARY TABLE t (i int)');
connection.query('INSERT INTO t VALUES(null)');
connection.query('SELECT cast(NULL AS CHAR)', function(err, _rows, _fields) {
  if (err) throw err;
  rows = _rows;
  fields = _fields;
});
connection.query('SELECT * from t', function(err, _rows, _fields) {
  if (err) throw err;
  rows1 = _rows;
  fields1 = _fields;
  connection.end();
});

process.on('exit', function() {
  assert.deepEqual(rows, [{'cast(NULL AS CHAR)': null}]);
  assert.equal(fields[0].columnType, 253);
  assert.deepEqual(rows1, [{'i': null}]);
  assert.equal(fields1[0].columnType, 3);
});

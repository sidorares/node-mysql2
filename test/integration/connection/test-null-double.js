var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var rows;

connection.query('CREATE TEMPORARY TABLE t (i int)');
connection.query('INSERT INTO t VALUES(null)');
connection.query('INSERT INTO t VALUES(123)');

connection.query('SELECT * from t', function(err, _rows, _fields) {
  if (err) throw err;
  rows = _rows;
  connection.end();
});


process.on('exit', function() {
  assert.deepEqual(rows[0], {i: null});
  assert.deepEqual(rows[1], {i: 123});
});

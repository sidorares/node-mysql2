var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

connection.query('CREATE TEMPORARY TABLE t (f DECIMAL(19,4))');
connection.query('INSERT INTO t VALUES(12345.67)');

var rows, fields;
connection.execute('SELECT f FROM t', function(err, _rows, _fields) {
  if (err) throw err;
  rows = _rows;
  fields = _fields;
  connection.end();
});

process.on('exit', function() {
  assert.deepEqual(rows, [{'f': '12345.6700'}]);
  assert.equal(fields[0].name, 'f');
});

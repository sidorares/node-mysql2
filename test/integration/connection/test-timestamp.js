var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

connection.query('CREATE TEMPORARY TABLE t (f TIMESTAMP)');
connection.query('INSERT INTO t VALUES(\'0000-00-00 00:00:00\')');
connection.query('INSERT INTO t VALUES(\'2013-01-22 01:02:03\')');

var rows, fields;
var rows1, fields1;
connection.query('SELECT f FROM t', function(err, _rows, _fields) {
  if (err) throw err;
  rows = _rows;
  fields = _fields;
});
connection.execute('SELECT f FROM t', function(err, _rows, _fields) {
  if (err) throw err;
  rows1 = _rows;
  fields1 = _fields;
});
connection.end();

process.on('exit', function() {
  assert.deepEqual(rows[0].f.toString(), 'Invalid Date');
  assert(rows[0].f instanceof Date);
  assert(rows[1].f instanceof Date);
  assert.equal(+rows[1].f, 1358776923000);
  assert.equal(fields[0].name, 'f');
  assert.deepEqual(rows[1], rows1[1]);
  assert.deepEqual(fields, fields1);
});

var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

var rowsTextProtocol;
var rowsBinaryProtocol;

connection.query('CREATE TEMPORARY TABLE binary_table (stuff BINARY(16));');
connection.query('INSERT INTO binary_table VALUES(null)');

connection.query('SELECT * from binary_table', function(err, _rows) {
  if (err) {
    throw err;
  }
  rowsTextProtocol = _rows;
  connection.execute('SELECT * from binary_table', function(
    err,
    _rows,
    _fields
  ) {
    if (err) {
      throw err;
    }
    rowsBinaryProtocol = _rows;
    connection.end();
  });
});

process.on('exit', function() {
  assert.deepEqual(rowsTextProtocol[0], { stuff: null });
  assert.deepEqual(rowsBinaryProtocol[0], { stuff: null });
});

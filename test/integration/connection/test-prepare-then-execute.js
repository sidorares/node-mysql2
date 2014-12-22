var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var _stmt    = null;
var _columns = null;
var _rows    = null;

connection.prepare('select 1 + ? + ? as test', function(err, stmt) {
  if (err) throw err;
  _stmt = stmt;
  stmt.execute([111, 123], function(err, rows, columns) {
    if (err) throw err;
    _columns = columns;
    _rows = rows;
    connection.end();
  });
});


process.on('exit', function() {
  assert.equal(_stmt.columns.length, 1);
  assert.equal(_stmt.parameters.length, 2);
  assert.deepEqual(_rows, [ { test: 235 } ]);
  assert.equal(_columns[0].name, 'test');
});

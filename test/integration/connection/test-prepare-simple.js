var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var _stmt;
var query = 'select 1 + ? + ? as test';
connection.prepare(query, function(err, stmt) {
  _stmt = stmt;
  connection.end();
});

process.on('exit', function() {
  assert.equal(_stmt.query, query);
  assert(_stmt.id >= 0);
  assert.equal(_stmt.columns.length, 1);
  assert.equal(_stmt.parameters.length, 1);
});

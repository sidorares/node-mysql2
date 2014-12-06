var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var _stmt1, _stmt2, _stmt3;
var query1 = 'select 1 + ? + ? as test';
var query2 = 'select 1 + 1';  // no parameters
var query3 = 'create temporary table aaa(i int);' // no parameters, no result columns

connection.prepare(query1, function(err1, stmt1) {
  _stmt1 = stmt1;
  _stmt1.close();
  connection.prepare(query2, function(err2, stmt2) {
    _stmt2 = stmt2;
    connection.prepare(query3, function(err3, stmt3) {
      _stmt3 = stmt3;
      _stmt2.close();
      _stmt3.close()
      connection.end();
    });
  });
});

process.on('exit', function() {
  assert.equal(_stmt1.query, query1);
  assert(_stmt1.id >= 0);
  assert.equal(_stmt1.columns.length, 1);
  assert.equal(_stmt1.parameters.length, 2);
});

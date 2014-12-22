var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var rows = undefined;
var rows1 = undefined;
var rows3 = undefined;

var q = 'select 1 + ? as test';
var key = 'undefined/undefined/undefined' + q;

connection.execute(q, [123], function(err, _rows, _fields) {
  if (err) throw err;
  rows = _rows;
  connection.execute(q, [124], function(err, _rows, _fields) {
    if (err) throw err;
    rows1 = _rows;
    connection.execute(q, [125], function(err, _rows, _fields) {
      if (err) throw err;
      rows2 = _rows;
      assert(Object.keys(connection._statements).length == 1);
      assert(connection._statements[key].query == q);
      assert(connection._statements[key].parameters.length == 1);
      connection.end();
    });
  });
});


process.on('exit', function() {
  assert.deepEqual(rows, [{'test': 124}]);
  assert.deepEqual(rows1, [{'test': 125}]);
  assert.deepEqual(rows2, [{'test': 126}]);
});


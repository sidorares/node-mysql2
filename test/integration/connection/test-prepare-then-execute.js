var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

connection.prepare('select 1 + ? + ? as test', function(err, stmt) {
  assert(stmt.id >= 0);
  connection.close();
  // WIP
  debugger;
});


process.on('exit', function() {
  //assert.deepEqual(rows, [{'test': 124}]);
  //assert.deepEqual(rows1, [{'test': 1}]);
  //assert.equal(fields[0].name, 'test');
});

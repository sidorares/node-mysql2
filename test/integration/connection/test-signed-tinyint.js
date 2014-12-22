var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var rows = undefined;

connection.query('CREATE TEMPORARY TABLE signed_ints  (b11 tinyint NOT NULL, b12 tinyint NOT NULL, b21 smallint NOT NULL)');
connection.query('INSERT INTO signed_ints values (-3, -120, 500)');
connection.query('INSERT INTO signed_ints values (3,  -110, -500)');

connection.execute('SELECT * from signed_ints', [5], function(err, _rows, _fields) {
  if (err) throw err;
  rows = _rows;
  connection.end();
});


process.on('exit', function() {
  assert.deepEqual(rows, [{"b11":-3,"b12":-120,"b21":500},{"b11":3,"b12":-110,"b21":-500}]);
});

var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

var rows = undefined;

connection.query("set time_zone = '+00:00'");
connection.execute('SELECT UNIX_TIMESTAMP(?) t', [new Date('1990-01-01 UTC')], function (err, _rows, _fields) {
  if (err) {
    throw err;
  }
  rows = _rows;
  connection.end();
});


process.on('exit', function () {
  assert.deepEqual(rows, [{t: 631152000}]);
});

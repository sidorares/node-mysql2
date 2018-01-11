var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

var date = new Date(2018, 02, 10, 15, 12, 34, 1234)

var rows, fields;
connection.execute('SELECT ? AS result', [date], function(err, _rows, _fields) {
  if (err) {
    throw err;
  }
  rows = _rows;
  fields = _fields;
  connection.end();
});

process.on('exit', function() {
  assert.deepEqual(rows, [{ result: date }]);
});

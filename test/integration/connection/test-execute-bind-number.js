var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

var rows, fields;
connection.execute('SELECT ? AS zeroValue, ? AS positiveValue, ? AS negativeValue, ? AS decimalValue', [0, 123, -123, 1.25], function(err, _rows, _fields) {
  if (err) {
    throw err;
  }
  rows = _rows;
  fields = _fields;
  connection.end();
});

process.on('exit', function() {
  assert.deepEqual(rows, [{ zeroValue: 0, positiveValue: 123, negativeValue: -123, decimalValue: 1.25 }]);
});

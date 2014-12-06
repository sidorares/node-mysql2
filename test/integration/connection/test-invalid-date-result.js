var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var rows = undefined;

connection.execute('SELECT TIMESTAMP(0000-00-00) t', [], function(err, _rows, _fields) {
  if (err) throw err;
  rows = _rows;
  connection.end();
});

function isInvalidTime(t) {
  return isNaN(t.getTime());
}

process.on('exit', function() {
  assert.deepEqual(Object.prototype.toString.call(rows[0].t), "[object Date]");
  assert.deepEqual(isInvalidTime(rows[0].t), true);
});

var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var rows = undefined;
var fields = undefined;
var multibyteText = '本日は晴天なり';
connection.query("SELECT '" + multibyteText + "'", function(err, _rows, _fields) {
  if (err) throw err;
  rows = _rows;
  fields = _fields;
  connection.end();
});


process.on('exit', function() {
  assert.equal(rows[0][multibyteText], multibyteText);
  assert.equal(fields[0].name, multibyteText);
});

var common     = require('../../common');
var connection = common.createConnection({charset: 'UTF8MB4_GENERAL_CI'});
var assert     = require('assert');

var rows = undefined;
var fields = undefined;
var multibyteText = '𠜎 𠜱 𠝹 𠱓 𠱸 𠲖 𠳏 𠳕 𠴕 𠵼 𠵿 𠸎 𠸏 𠹷 𠺝 𠺢 ';
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

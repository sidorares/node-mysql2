var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var rows = undefined;
var fields = undefined;
var date = new Date('1990-01-01 08:15:11 UTC');
connection.execute('select from_unixtime(?) t', [(+date).valueOf()/1000], function(err, _rows, _fields) {
  if (err) throw err;
  rows = _rows;
  fields = _fields;
});

connection.end();

process.on('exit', function() {
  assert.equal(rows[0].t.constructor, Date);
  assert.equal(rows[0].t.getDate(), date.getDate());
  assert.equal(rows[0].t.getHours(), date.getHours());
  assert.equal(rows[0].t.getMinutes(), date.getMinutes());
  assert.equal(rows[0].t.getSeconds(), date.getSeconds());
});

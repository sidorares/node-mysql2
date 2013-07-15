var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var rows = undefined;
var rows1 = undefined;
var date = new Date('1990-01-01 08:15:11 UTC');
connection.execute('select from_unixtime(?) t', [(+date).valueOf()/1000], function(err, _rows, _fields) {
  if (err) throw err;
  rows = _rows;
});

connection.query('select from_unixtime(631152000) t', function(err, _rows, _fields) {
  if (err) throw err;
  rows1 = _rows;
});

connection.end();

process.on('exit', function() {
  assert.equal(rows[0].t.constructor, Date);
  assert.equal(rows[0].t.getDate(), date.getDate());
  assert.equal(rows[0].t.getHours(), date.getHours());
  assert.equal(rows[0].t.getMinutes(), date.getMinutes());
  assert.equal(rows[0].t.getSeconds(), date.getSeconds());

  assert.equal(rows1[0].t.constructor, Date);
  assert.equal(rows1[0].t - new Date('Mon Jan 01 1990 11:00:00 GMT+1100 (EST)'), 0);
});

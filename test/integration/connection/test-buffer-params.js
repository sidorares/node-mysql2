var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var rows = undefined;
var rows1 = undefined;
var fields = undefined;
var fields1 = undefined;

var buf = Buffer([0x80, 0x90, 1, 2, 3, 4, 5, 6, 7, 8, 9, 100, 100, 255, 255]);
connection.execute('SELECT HEX(?) as buf', [buf], function(err, _rows, _fields) {
  if (err) throw err;
  rows = _rows;
  fields = _fields;
});

connection.query('SELECT HEX(?) as buf', [buf], function(err, _rows, _fields) {
  if (err) throw err;
  rows1 = _rows;
  fields1 = _fields;
  connection.end();
});


process.on('exit', function() {
  assert.deepEqual(rows, [{buf: buf.toString('hex').toUpperCase()}]);
  assert.deepEqual(rows1, [{buf: buf.toString('hex').toUpperCase()}]);
});

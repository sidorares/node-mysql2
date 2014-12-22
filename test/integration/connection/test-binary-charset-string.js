var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var rows = undefined;
var fields = undefined;
var rows1 = undefined;
var fields1 = undefined;
var rows2 = undefined;
var fields2 = undefined;
var rows3 = undefined;
var fields3 = undefined;

var rows4 = undefined;
var fields4 = undefined;
var rows5 = undefined;
var fields5 = undefined;

var query = "SELECT x'010203'";
var query1 = "SELECT '010203'";

connection.query(query, function(err, _rows, _fields) {
  if (err) throw err;
  rows = _rows;
  fields = _fields;
});

connection.query(query, function(err, _rows, _fields) {
  if (err) throw err;
  rows5 = _rows;
  fields5 = _fields;
});

connection.query(query1, function(err, _rows, _fields) {
  if (err) throw err;
  rows1 = _rows;
  fields1 = _fields;
});

connection.execute(query, [], function(err, _rows, _fields) {
  if (err) throw err;
  rows2 = _rows;
  fields2 = _fields;
});

// repeat same query - test cached fields and parser
connection.execute(query, [], function(err, _rows, _fields) {
  if (err) throw err;
  rows4 = _rows;
  fields4 = _fields;
});

connection.execute(query1, [], function(err, _rows, _fields) {
  if (err) throw err;
  rows3 = _rows;
  fields3 = _fields;
  connection.end();
});


process.on('exit', function() {
  assert.deepEqual(rows, [{"x'010203'": Buffer([1, 2, 3])}]);
  assert.equal(fields[0].name, "x'010203'");
  assert.deepEqual(rows1, [{'010203': '010203'}]);
  assert.equal(fields1[0].name, "010203");
  assert.deepEqual(rows2, [{"x'010203'": Buffer([1, 2, 3])}]);
  assert.equal(fields2[0].name, "x'010203'");
  assert.deepEqual(rows3, [{'010203': '010203'}]);
  assert.equal(fields3[0].name, "010203");

  assert.deepEqual(rows4, [{"x'010203'": Buffer([1, 2, 3])}]);
  assert.equal(fields4[0].name, "x'010203'");
  assert.deepEqual(rows5, [{"x'010203'": Buffer([1, 2, 3])}]);
  assert.equal(fields5[0].name, "x'010203'");
});

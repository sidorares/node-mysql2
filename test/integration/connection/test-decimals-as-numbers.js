var common = require('../../common');

var connection1 = common.createConnection({
  decimalNumbers: false
});
var connection2 = common.createConnection({
  decimalNumbers: true
});
var assert = require('assert');

var largeDecimal = 900719.547409;
var largeDecimalExpected = '900719.547409000000000000000000000000';
var largeMoneyValue = 900719925474.99;

connection1.query('CREATE TEMPORARY TABLE t1 (d1 DECIMAL(65, 30))');
connection1.query('INSERT INTO t1 set d1=?', [largeDecimal]);

connection2.query('CREATE TEMPORARY TABLE t2 (d1 DECIMAL(14, 2))');
connection2.query('INSERT INTO t2 set d1=?', [largeMoneyValue]);

connection1.execute('select d1 from t1', function (err, _rows, _fields) {
  if (err) {
    throw err;
  }
  assert.equal(_rows[0].d1.constructor, String);
  assert.equal(_rows[0].d1, largeDecimalExpected);
  connection1.end();
});

connection2.query('select d1 from t2', function (err, _rows, _fields) {
  if (err) {
    throw err;
  }
  assert.equal(_rows[0].d1.constructor, Number);
  assert.equal(_rows[0].d1, largeMoneyValue);
  connection2.end();
});

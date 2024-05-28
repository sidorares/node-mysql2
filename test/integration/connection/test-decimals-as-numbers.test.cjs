'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');

const connection1 = common.createConnection({
  decimalNumbers: false,
});
const connection2 = common.createConnection({
  decimalNumbers: true,
});

const largeDecimal = 900719.547409;
const largeDecimalExpected = '900719.547409000000000000000000000000';
const largeMoneyValue = 900719925474.99;

connection1.query('CREATE TEMPORARY TABLE t1 (d1 DECIMAL(65, 30))');
connection1.query('INSERT INTO t1 set d1=?', [largeDecimal]);

connection2.query('CREATE TEMPORARY TABLE t2 (d1 DECIMAL(14, 2))');
connection2.query('INSERT INTO t2 set d1=?', [largeMoneyValue]);

connection1.execute('select d1 from t1', (err, _rows) => {
  if (err) {
    throw err;
  }
  assert.equal(_rows[0].d1.constructor, String);
  assert.equal(_rows[0].d1, largeDecimalExpected);
  connection1.end();
});

connection2.query('select d1 from t2', (err, _rows) => {
  if (err) {
    throw err;
  }
  assert.equal(_rows[0].d1.constructor, Number);
  assert.equal(_rows[0].d1, largeMoneyValue);
  connection2.end();
});

'use strict';

const assert = require('assert');
const common = require('../../common');

const connection = common.createConnection({decimalStringTrimTrailingZero: true});
connection.query('CREATE TEMPORARY TABLE t (a decimal(38,16), b varchar(39))');
connection.query('INSERT INTO t values(\'1.00\', \'1.00\')');
connection.query('INSERT INTO t values(\'1.01\', \'1.01\')');
connection.query('INSERT INTO t values(\'1.10\', \'1.10\')');
connection.query('INSERT INTO t values(\'1.010\', \'1.010\')');
connection.query('INSERT INTO t values(\'0.00\', \'0.00\')');
connection.query('INSERT INTO t values(\'100000.0000100000000000\', \'100000.0000100000000000\')');
connection.query('INSERT INTO t values(\'100000.0000000000000000\', \'100000.0000000000000000\')');


// JSON without encoding options - should result in unexpected behaviors
connection.query({
  sql: 'SELECT * FROM t',
}, (err, rows) => {
  assert.ifError(err);
  assert.equal(rows[0].a, "1");
  assert.equal(rows[0].b, "1.00");

  assert.equal(rows[1].a, "1.01");
  assert.equal(rows[1].b, "1.01");

  assert.equal(rows[2].a, "1.1");
  assert.equal(rows[2].b, "1.10");

  assert.equal(rows[3].a, "1.01");
  assert.equal(rows[3].b, "1.010");

  assert.equal(rows[4].a, "0");
  assert.equal(rows[4].b, "0.00");

  assert.equal(rows[5].a, "100000.00001");
  assert.equal(rows[5].b, "100000.0000100000000000");

  assert.equal(rows[6].a, "100000");
  assert.equal(rows[6].b, "100000.0000000000000000");
});

connection.end();

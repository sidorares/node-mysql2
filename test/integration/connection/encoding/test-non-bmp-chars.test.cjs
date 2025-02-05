'use strict';

const common = require('../../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

// 4 bytes in utf8
const pileOfPoo = '💩';

const connection = common.createConnection({ charset: 'UTF8_GENERAL_CI' });
connection.query('select "💩"', (err, rows, fields) => {
  assert.ifError(err);
  assert.equal(fields[0].name, pileOfPoo);
  assert.equal(rows[0][fields[0].name], pileOfPoo);
  connection.end();
});

const connection2 = common.createConnection({ charset: 'UTF8MB4_GENERAL_CI' });
connection2.query('select "💩"', (err, rows, fields) => {
  assert.ifError(err);
  assert.equal(fields[0].name, '?');
  assert.equal(rows[0]['?'], pileOfPoo);
  connection2.end();
});

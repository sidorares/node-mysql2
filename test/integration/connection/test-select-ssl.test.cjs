'use strict';

const { assert } = require('poku');
const common = require('../../common.test.cjs');
const process = require('node:process');

const connection = common.createConnection();

connection.query(`SHOW STATUS LIKE 'Ssl_cipher'`, (err, rows) => {
  assert.ifError(err);
  if (process.env.MYSQL_USE_TLS === '1') {
    assert.equal(rows[0].Value.length > 0, true);
  } else {
    assert.deepEqual(rows, [{ Variable_name: 'Ssl_cipher', Value: '' }]);
  }

  connection.execute(`SHOW STATUS LIKE 'Ssl_cipher'`, (err, rows) => {
    assert.ifError(err);
    if (process.env.MYSQL_USE_TLS === '1') {
      assert.equal(rows[0].Value.length > 0, true);
    } else {
      assert.deepEqual(rows, [{ Variable_name: 'Ssl_cipher', Value: '' }]);
    }

    connection.end((err) => {
      assert.ifError(err);
      process.exit(0);
    });
  });
});

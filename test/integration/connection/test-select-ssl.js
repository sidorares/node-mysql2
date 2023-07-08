'use strict';

const assert = require('assert');
const common = require('../../common');
const connection = common.createConnection();

connection.query(`SHOW STATUS LIKE 'Ssl_cipher'`, (err, rows) => {
  assert.ifError(err);
  if (process.env.MYSQL_USE_TLS === '1') {
    assert.equal(rows[0].Value.slice(0, 8), 'TLS_AES_');
  } else {
    assert.deepEqual(rows, [{ Variable_name: 'Ssl_cipher', Value: '' }]);
  }
  connection.end();
});

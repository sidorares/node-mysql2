'use strict';

const common = require('../../../common.test.cjs');
const { assert } = require('poku');

const connection = common.createConnection({ charset: 'UTF8MB4_GENERAL_CI' });
const text = 'привет, мир';

connection.query('SET character_set_client=koi8r', (err) => {
  assert.ifError(err);
  connection.query(`SELECT ? as result`, [text], (err, rows) => {
    assert.ifError(err);
    assert.equal(rows[0].result, text);
    connection.query('SET character_set_client=cp1251', (err) => {
      assert.ifError(err);
      connection.query(`SELECT ? as result`, [text], (err, rows) => {
        assert.ifError(err);
        assert.equal(rows[0].result, text);
        connection.end();
      });
    });
  });
});

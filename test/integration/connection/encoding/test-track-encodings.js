'use strict';

const common = require('../../../common');
const assert = require('assert');

const connection = common.createConnection({ charset: 'UTF8MB4_GENERAL_CI' });
const text = 'привет, мир';

connection.query('SET character_set_client=koi8r', err => {
  assert.ifError(err);
  connection.query('SELECT ?', [text], (err, rows) => {
    assert.ifError(err);
    assert.equal(rows[0][text], text);
    connection.query('SET character_set_client=cp1251', err => {
      assert.ifError(err);
      connection.query('SELECT ?', [text], (err, rows) => {
        assert.ifError(err);
        assert.equal(rows[0][text], text);
        connection.end();
      });
    });
  });
});

var mysql = require('../../../../index.js');
var common = require('../../../common');
var assert = require('assert');

var connection = common.createConnection({charset: 'UTF8MB4_GENERAL_CI'});
var text = 'привет, мир';

connection.query('SET character_set_client=koi8r', function(err, res) {
  assert.ifError(err);
  connection.query('SELECT ?', [text], function(err, rows) {
    assert.ifError(err);
    assert.equal(rows[0][text], text);
    connection.query('SET character_set_client=cp1251', function(err, res) {
      assert.ifError(err);
      connection.query('SELECT ?', [text], function(err, rows) {
        assert.ifError(err);
        assert.equal(rows[0][text], text);
        connection.end();
      });
    });
  });
});

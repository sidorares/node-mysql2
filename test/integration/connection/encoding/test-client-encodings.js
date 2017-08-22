var mysql = require('../../../../index.js');
var common = require('../../../common');
var assert = require('assert');

var connection = common.createConnection({ charset: 'UTF8MB4_GENERAL_CI' });
connection.query('drop table if exists __test_client_encodings');
connection.query(
  'create table if not exists __test_client_encodings (name VARCHAR(200)) CHARACTER SET=utf8mb4',
  function(err) {
    assert.ifError(err);
    connection.query('delete from __test_client_encodings', function(err) {
      assert.ifError(err);
      connection.end();

      var connection1 = common.createConnection({
        charset: 'CP1251_GENERAL_CI'
      });
      connection1.query(
        'insert into __test_client_encodings values("привет, мир")',
        function(err) {
          assert.ifError(err);
          connection1.end();

          var connection2 = common.createConnection({
            charset: 'KOI8R_GENERAL_CI'
          });
          connection2.query('select * from __test_client_encodings', function(
            err,
            rows
          ) {
            assert.ifError(err);
            assert.equal(rows[0].name, 'привет, мир');
            connection2.end();
          });
        }
      );
    });
  }
);

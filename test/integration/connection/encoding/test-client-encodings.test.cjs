'use strict';

const common = require('../../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale (unsupported non utf8 charsets)');
  process.exit(0);
}

const connection = common.createConnection({ charset: 'UTF8MB4_GENERAL_CI' });
connection.query('drop table if exists __test_client_encodings');
connection.query(
  'create table if not exists __test_client_encodings (name VARCHAR(200)) CHARACTER SET=utf8mb4',
  (err) => {
    assert.ifError(err);
    connection.query('delete from __test_client_encodings', (err) => {
      assert.ifError(err);
      connection.end();

      const connection1 = common.createConnection({
        charset: 'CP1251_GENERAL_CI',
      });
      connection1.query(
        'insert into __test_client_encodings values("привет, мир")',
        (err) => {
          assert.ifError(err);
          connection1.end();

          const connection2 = common.createConnection({
            charset: 'KOI8R_GENERAL_CI',
          });
          connection2.query(
            'select * from __test_client_encodings',
            (err, rows) => {
              assert.ifError(err);
              assert.equal(rows[0].name, 'привет, мир');
              connection2.end();
            },
          );
        },
      );
    });
  },
);

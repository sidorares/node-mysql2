'use strict';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

const assert = require('assert');
const common = require('../../common');
const connection = common.createConnection();
const onlyUsername = function(name) {
  return name.substring(0, name.indexOf('@'));
};

connection.query(
  "CREATE USER IF NOT EXISTS 'changeuser1'@'%' IDENTIFIED BY 'changeuser1pass'"
);
connection.query(
  "CREATE USER IF NOT EXISTS 'changeuser2'@'%' IDENTIFIED BY 'changeuser2pass'"
);
connection.query("GRANT ALL ON *.* TO 'changeuser1'@'%'");
connection.query("GRANT ALL ON *.* TO 'changeuser2'@'%'");
connection.query('FLUSH PRIVILEGES');

connection.changeUser(
  {
    user: 'changeuser1',
    password: 'changeuser1pass'
  },
  err => {
    assert.ifError(err);
    connection.query('select current_user()', (err, rows) => {
      assert.ifError(err);
      assert.deepEqual(onlyUsername(rows[0]['current_user()']), 'changeuser1');

      connection.changeUser(
        {
          user: 'changeuser2',
          password: 'changeuser2pass'
        },
        err => {
          assert.ifError(err);

          connection.query('select current_user()', (err, rows) => {
            assert.ifError(err);
            assert.deepEqual(
              onlyUsername(rows[0]['current_user()']),
              'changeuser2'
            );

            connection.changeUser(
              {
                user: 'changeuser1',
                password: 'changeuser1pass',
                passwordSha1: Buffer.from(
                  'f961d39c82138dcec42b8d0dcb3e40a14fb7e8cd',
                  'hex'
                ) // sha1(changeuser1pass)
              },
              () => {
                connection.query('select current_user()', (err, rows) => {
                  assert.ifError(err);
                  assert.deepEqual(
                    onlyUsername(rows[0]['current_user()']),
                    'changeuser1'
                  );
                  connection.end();
                });
              }
            );
          });
        }
      );
    });
  }
);

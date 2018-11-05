'use strict';

const assert = require('assert');
const common = require('../../common');
const connection = common.createConnection();
const onlyUsername = function(name) {
  return name.substring(0, name.indexOf('@'));
};

function testIncorrectDb() {
  connection.end();
  // TODO figure out if stuff below is still relevant
  /*
  connection.on('error', function (err) {
    assert.ok(err, 'got disconnect');
    assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
  });
  connection.changeUser({database: 'does-not-exist', }, function (err) {
    assert.ok(err, 'got error');
    assert.equal(err.code, 'ER_BAD_DB_ERROR');
    assert.equal(err.fatal, true);
  });
  connection.end();
  */
}

// create test user first
connection.query(
  "GRANT ALL ON *.* TO 'changeuser1'@'%' IDENTIFIED BY 'changeuser1pass'"
);
connection.query(
  "GRANT ALL ON *.* TO 'changeuser2'@'%' IDENTIFIED BY 'changeuser2pass'"
);
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
                  testIncorrectDb();
                });
              }
            );
          });
        }
      );
    });
  }
);

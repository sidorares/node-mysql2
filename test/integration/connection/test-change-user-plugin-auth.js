var Buffer = require('safe-buffer').Buffer;

var assert = require('assert');
var common = require('../../common');
var connection = common.createConnection({
  authSwitchHandler: function() {
    throw new Error(
      'should not be called - we expect mysql_native_password ' +
        'plugin switch request to be handled by internal handler'
    );
  }
});
var onlyUsername = function(name) {
  return name.substring(0, name.indexOf('@'));
};

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
  function(err, res) {
    assert.ifError(err);
    connection.query('select current_user()', function(err, rows) {
      assert.ifError(err);
      assert.deepEqual(onlyUsername(rows[0]['current_user()']), 'changeuser1');

      connection.changeUser(
        {
          user: 'changeuser2',
          password: 'changeuser2pass'
        },
        function(err, res) {
          assert.ifError(err);

          connection.query('select current_user()', function(err, rows) {
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
              function(err, res) {
                connection.query('select current_user()', function(err, rows) {
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

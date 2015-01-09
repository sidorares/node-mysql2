var assert     = require('assert');
var common     = require('../../common');
var connection = common.createConnection();

// create test user first
connection.query("GRANT ALL ON *.* TO 'changeuser1'@'localhost' IDENTIFIED BY 'changeuser1pass'");
connection.query("GRANT ALL ON *.* TO 'changeuser2'@'localhost' IDENTIFIED BY 'changeuser2pass'");
connection.query('FLUSH PRIVILEGES');

connection.changeUser({
  user: 'changeuser1',
  password: 'changeuser1pass'
});
connection.query('select user()', function(err, rows) {
  if (err) throw err;
  assert.deepEqual(rows, [ { 'user()': 'changeuser1@localhost' } ]);
});

connection.changeUser({
  user: 'changeuser2',
  password: 'changeuser2pass'
});

connection.query('select user()', function(err, rows) {
  if (err) throw err;
  assert.deepEqual(rows, [ { 'user()': 'changeuser2@localhost' } ]);
});

connection.changeUser({
  user: 'changeuser1',
  passwordSha1: new Buffer('f961d39c82138dcec42b8d0dcb3e40a14fb7e8cd', 'hex') // sha1(changeuser1pass)
});
connection.query('select user()', function(err, rows) {
  if (err) throw err;
  assert.deepEqual(rows, [ { 'user()': 'changeuser1@localhost' } ]);
});

connection.end();

// from felixge/node-mysql/test/unit/connection/test-change-database-fatal-error.js:
// This test verifies that changeUser errors are treated as fatal errors.  The
// rationale for that is that a failure to execute a changeUser sequence may
// cause unexpected behavior for queries that were enqueued under the
// assumption of changeUser to succeed.

var beforeChange = 1;
connection.changeUser({database: 'does-not-exist'}, function (err) {
  assert.ok(err, 'got error');
  assert.equal(err.code, 'ER_BAD_DB_ERROR');
  assert.equal(err.fatal, true);
});

connection.on('error', function(err) {
  assert.ok(err, 'got disconnect');
  assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
  assert.equal(beforeChange, 1);
});

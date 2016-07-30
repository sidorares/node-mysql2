var common = require('../../common');
var assert = require('assert');

process.on('uncaughtException', function (err) {
  assert.ifError(err);
});

var connection1 = common.createConnection({
  username: 'wtf',
  password: 'lol'
});

// error will NOT bubble up to process level if `on` is used
connection1.on('error', function (err) {
  assert.ok(err);
});

var connection2 = common.createConnection({
  username: 'wtf',
  password: 'lol'
});

// error will bubble up to process level if `once` is used
connection2.once('error', function (err) {
  assert.ok(err);
});

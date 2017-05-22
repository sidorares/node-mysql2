var common = require('../../common');
var assert = require('assert');

var callCount = 0;
var exceptionCount = 0;

process.on('uncaughtException', function(err) {
  assert.ifError(err);
  exceptionCount++;
});

var connection1 = common.createConnection({
  password: 'lol'
});

// error will NOT bubble up to process level if `on` is used
connection1.on('error', function() {
  callCount++;
});

var connection2 = common.createConnection({
  password: 'lol'
});

// error will bubble up to process level if `once` is used
connection2.once('error', function() {
  callCount++;
});

process.on('exit', function() {
  assert.equal(callCount, 2);
  assert.equal(exceptionCount, 0);
});

var common = require('../../common');
var connection = common.createConnection({
  host: 'www.google.com'
});
var assert = require('assert');

var errorCount = 0;
var error = null;


connection.on('error', function (err) {
  errorCount++;
  error = err;
});

process.on('exit', function () {
  assert.equal(errorCount, 1);
  assert.equal(error.code, 'ETIMEDOUT');
});

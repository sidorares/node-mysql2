var config = require('../../common.js').config;

var skipTest = false;
if (typeof Promise == 'undefined') {
  console.log('no Promise support, skipping test');
  skipTest = true;
  process.exit(0);
}

var assert = require('assert');
var createPool = require('../../../promise.js').createPool;
var PoolConnection = require('../../../lib/pool_connection.js');

// stub
var release = PoolConnection.prototype.release;
var releaseCalls = 0;
PoolConnection.prototype.release = function() {
  releaseCalls++;
};

function testPoolPromiseExecuteLeak() {
  var pool = createPool(config);
  var conn = null;
  pool
    .execute('select 1+2 as ttt')
    .then(function(result) {
      assert.equal(result[0][0].ttt, 3);
      return pool.end();
    })
    .catch(function(err) {
      assert.ifError(err);
    });
}

testPoolPromiseExecuteLeak();

process.on('exit', function() {
  PoolConnection.prototype.release = release;
  if (skipTest) {
    return;
  }
  assert.equal(releaseCalls, 1, 'PoolConnection.release was not called');
});

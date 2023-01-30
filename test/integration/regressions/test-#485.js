'use strict';

const config = require('../../common.js').config;

const assert = require('assert');
const createPoolPromise = require('../../../promise.js').createPool;
const PoolConnection = require('../../../lib/pool_connection.js');

function createPool(args) {
  if (!args && process.env.MYSQL_CONNECTION_URL) {
    return createPoolPromise({ uri: process.env.MYSQL_CONNECTION_URL });
  }
  return createPoolPromise({ ...config, ...args });
}

// stub
const release = PoolConnection.prototype.release;
let releaseCalls = 0;
PoolConnection.prototype.release = function() {
  releaseCalls++;
};

function testPoolPromiseExecuteLeak() {
  const pool = createPool();
  pool
    .execute('select 1+2 as ttt')
    .then(result => {
      assert.equal(result[0][0].ttt, 3);
      return pool.end();
    })
    .catch(err => {
      assert.ifError(err);
    });
}

testPoolPromiseExecuteLeak();

process.on('exit', () => {
  PoolConnection.prototype.release = release;
  assert.equal(releaseCalls, 1, 'PoolConnection.release was not called');
});

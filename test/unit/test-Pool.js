'use strict';

const mysql = require('../..');
const Pool = require('../../lib/pool');
const test = require('utest');
const assert = require('assert');

const poolConfig = {}; // config: { connectionConfig: {} } };

const pool = new mysql.createPool(poolConfig);
test('Pool', {
  'exposes escape': () => {
    assert.equal(pool.escape(123), '123');
  },

  'exposes escapeId': () => {
    assert.equal(pool.escapeId('table name'), '`table name`');
  },

  'exposes format': () => {
    const params = ['table name', 'thing'];
    assert.equal(
      pool.format('SELECT a FROM ?? WHERE b = ?', params),
      "SELECT a FROM `table name` WHERE b = 'thing'"
    );
  },
  'pool is closed error message': () => {
    const poolIsClosedError = Pool._generatePoolIsClosedError();
    assert.equal(
      poolIsClosedError.message,
      'Pool is closed.'
    )
  },
  'pool is closed error code': () => {
    const poolIsClosedError = Pool._generatePoolIsClosedError();
    assert.equal(
      poolIsClosedError.code,
      'POOL_CLOSED'
    )
  }
});

const poolDotPromise = pool.promise();
test('Pool.promise()', {
  'exposes escape': () => {
    assert.equal(poolDotPromise.escape(123), '123');
  },

  'exposes escapeId': () => {
    assert.equal(poolDotPromise.escapeId('table name'), '`table name`');
  },

  'exposes format': () => {
    const params = ['table name', 'thing'];
    assert.equal(
      poolDotPromise.format('SELECT a FROM ?? WHERE b = ?', params),
      "SELECT a FROM `table name` WHERE b = 'thing'"
    );
  }
});

const promisePool = new mysql.createPoolPromise(poolConfig);
// REVIEW!
test('PromisePool', {
  'exposes escape': () => {
    assert.equal(promisePool.escape(123), '123');
  },

  'exposes escapeId': () => {
    assert.equal(promisePool.escapeId('table name'), '`table name`');
  },

  'exposes format': () => {
    const params = ['table name', 'thing'];
    assert.equal(
      promisePool.format('SELECT a FROM ?? WHERE b = ?', params),
      "SELECT a FROM `table name` WHERE b = 'thing'"
    );
  }
});

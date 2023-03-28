'use strict';

const mysql = require('../..');
const test = require('utest');
const assert = require('assert');
const common = require('../common');

const poolConfig = common.getConfig();

const ACQUITE_TIMEOUT = 500;
const poolWithAcquireTimeout = new mysql.createPool({
  ...poolConfig,
  acquireTimeout: ACQUITE_TIMEOUT,
  connectionLimit: 2
});

poolWithAcquireTimeout.getConnection((err, c1) => {
  assert.equal(!!c1, true);
  assert.ifError(err);
  poolWithAcquireTimeout.getConnection((err, c2) => {
    assert.ifError(err);
    assert.equal(!!c2, true);
    const C3_STARTED_AT = Date.now();
    poolWithAcquireTimeout.getConnection((e3, c3) => {
      const C3_DONE_AT = Date.now();

      poolWithAcquireTimeout.releaseConnection(c1);

      poolWithAcquireTimeout.getConnection((e4, c4) => {

        test('Pool With Acquire Timeout', {
          'timeout of pool is full': () => {
            assert.equal(e3 !== null, true);
            assert.equal(!c3, true);
            assert.equal(C3_DONE_AT - C3_STARTED_AT >= ACQUITE_TIMEOUT, true);
            assert.equal(C3_DONE_AT - C3_STARTED_AT < ACQUITE_TIMEOUT * 2, true);
          },
          'ok if pool is not full': () => {
            assert.equal(e4 === null, true);
            assert.equal(!!c4, true);
          }
        });
    
        poolWithAcquireTimeout.releaseConnection(c4);
      });
    });
  });
});

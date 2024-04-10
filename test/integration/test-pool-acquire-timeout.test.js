'use strict';

const mysql = require('../..');
const assert = require('assert');
const common = require('../common.test.cjs');

const poolConfig = common.getConfig();

const ACQUIRE_TIMEOUT = 500;
const pool = new mysql.createPool({
  ...poolConfig,
  acquireTimeout: ACQUIRE_TIMEOUT,
  connectionLimit: 2
});

pool.getConnection((err, c1) => {
  assert.equal(!!c1, true);
  assert.ifError(err);

  pool.getConnection((err, c2) => {
    assert.ifError(err);
    assert.equal(!!c2, true);

    const C3_STARTED_AT = Date.now();

    pool.getConnection((e3, c3) => {
      const C3_DONE_AT = Date.now();
      assert.equal(C3_DONE_AT - C3_STARTED_AT >= ACQUIRE_TIMEOUT, true);
      assert.equal(C3_DONE_AT - C3_STARTED_AT < ACQUIRE_TIMEOUT * 2, true);

      assert.notEqual(e3, null);
      assert.equal(e3.message, 'Timeout acquiring connection', 'Acquire timeout error message is correct');
      assert.equal(!c3, true);
      c1.release();

      pool.getConnection((e4, c4) => {
        assert.equal(e4, null);
        assert.equal(!!c4, true);

        c4.release();
        c2.release();
        pool.end();
      });
    });
  });
});

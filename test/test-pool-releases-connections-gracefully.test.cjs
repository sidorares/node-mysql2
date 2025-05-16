'use strict';
const createPool = require('../common.test.cjs').createPool;
const { assert } = require('poku');

/**
 * This test case tests that the pool releases connections gracefully after the idle timeout has passed.
 *
 * @see https://github.com/sidorares/node-mysql2/issues/3148
 */

const pool = new createPool({
  connectionLimit: 3,
  maxIdle: 2,
  idleTimeout: 1000,
});

let connection1Ended = false;
let connection2Ended = false;
let connection3Ended = false;

pool.getConnection((_err1, connection1) => {
  pool.getConnection((_err2, connection2) => {
    pool.getConnection((_err3, connection3) => {
      connection1.stream.on('end', () => (connection1Ended = true));
      connection2.stream.on('end', () => (connection2Ended = true));
      connection3.stream.on('end', () => (connection3Ended = true));

      connection1.release();
      connection2.release();
      connection3.release();

      setTimeout(() => {
        assert(connection1Ended, 'connection1 should have ended');
        assert(connection2Ended, 'connection2 should have ended');
        assert(connection3Ended, 'connection3 should have ended');

        pool.end();
      }, 2000);
    });
  });
});

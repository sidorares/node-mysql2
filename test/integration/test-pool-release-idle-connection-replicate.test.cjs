'use strict';
const createPool = require('../common.test.cjs').createPool;
const { assert } = require('poku');

/**
 * This test case tests the scenario where released connections are not
 * being destroyed after the idle timeout has passed, to do this we setup
 * a pool with a connection limit of 3, and a max idle of 2, and an idle
 * timeout of 1 second. We then create 3 connections, and release them
 * after 1 second, we then check that the pool has 0 connections, and 0
 * free connections.
 *
 * @see https://github.com/sidorares/node-mysql2/issues/3020
 */

/**
 * This test case
 */
const pool = new createPool({
  connectionLimit: 3,
  maxIdle: 2,
  idleTimeout: 1000,
});

/**
 * Create the first connection and ensure it's in the pool as expected
 */
pool.getConnection((err1, connection1) => {
  assert.ifError(err1);
  assert.ok(connection1);

  /**
   * Create the second connection and ensure it's in the pool as expected
   */
  pool.getConnection((err2, connection2) => {
    assert.ifError(err2);
    assert.ok(connection2);

    /**
     * Create the third connection and ensure it's in the pool as expected
     */
    pool.getConnection((err3, connection3) => {
      assert.ifError(err3);
      assert.ok(connection3);

      /**
       * Release all the connections
       */
      connection1.release();
      connection2.release();
      connection3.release();

      /**
       * After the idle timeout has passed, check that all items in the in the pool
       * that have been released are destroyed as expected.
       */
      setTimeout(() => {
        assert(
          pool._allConnections.length === 0,
          `Expected all connections to be closed, but found ${pool._allConnections.length}`
        );
        assert(
          pool._freeConnections.length === 0,
          `Expected all free connections to be closed, but found ${pool._freeConnections.length}`
        );

        pool.end();
      }, 5000);
    });
  });
});

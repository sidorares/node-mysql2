'use strict';
const createPool = require('../../common.test.cjs').createPool;
const { assert } = require('poku');

/**
 * This test case tests that the pool releases connections gracefully after the idle timeout has passed.
 *
 * @see https://github.com/sidorares/node-mysql2/issues/3148
 */

/**
 * By providing gracefulEnd when creating the pool, the end method of a pooled connection
 * will actually close the connection instead of releasing it back to the pool.
 */
const pool = new createPool({ gracefulEnd: true });
let warningEmitted = false;

pool.getConnection((_err1, connection) => {
  connection.on('warn', () => {
    warningEmitted = true;
  });

  connection.end();
  pool.end();
});

process.on('exit', () => {
  assert(!warningEmitted, 'Warning should not be emitted');
});

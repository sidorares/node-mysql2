'use strict';
const createPool = require('../common.test.cjs').createPool;
const { assert } = require('poku');

/**
 * This test case tests that the pool releases connections gracefully after the idle timeout has passed.
 *
 * @see https://github.com/sidorares/node-mysql2/issues/3148
 */

/**
 * By default, the end method of a pooled connection will just release it back to the pool.
 * This is compatibility behavior with mysqljs/mysql.
 */
const defaultPool = new createPool();

defaultPool.getConnection((_err1, connection) => {
  let warningEmitted = false;

  connection.on('warn', (warning) => {
    warningEmitted = true;
    assert(
      warning.message.startsWith(
        'Calling conn.end() to release a pooled connection is deprecated'
      )
    );
  });
  connection.end();

  setTimeout(() => {
    assert(warningEmitted, 'Warning should be emitted');
    defaultPool.end();
  }, 2000);
});

/**
 * By providing gracefulEnd when creating the pool, the end method of a pooled connection
 * will actually close the connection instead of releasing it back to the pool.
 */
const poolWithGratefulEnd = new createPool({ gracefulEnd: true });

poolWithGratefulEnd.getConnection((_err1, connection) => {
  let warningEmitted = false;

  connection.on('warn', () => {
    warningEmitted = true;
  });
  connection.end();

  setTimeout(() => {
    assert(!warningEmitted, 'Warning should not be emitted');
    poolWithGratefulEnd.end();
  }, 2000);
});

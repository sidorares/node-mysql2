'use strict';
const createPool = require('../../common.test.cjs').createPool;
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
const pool = new createPool();
let warningEmitted = false;

pool.getConnection((_err1, connection) => {
  connection.on('warn', (warning) => {
    warningEmitted = true;
    assert(
      warning.message.startsWith(
        'Calling conn.end() to release a pooled connection is deprecated'
      )
    );
  });

  connection.end();
  pool.end();
});

process.on('exit', () => {
  assert(warningEmitted, 'Warning should be emitted');
});

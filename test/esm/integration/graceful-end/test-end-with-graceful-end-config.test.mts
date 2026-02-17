import type { PoolConnection } from '../../../../index.js';
import { assert } from 'poku';
import { createPool } from '../../common.test.mjs';

/**
 * This test case tests that the pool releases connections gracefully after the idle timeout has passed.
 *
 * @see https://github.com/sidorares/node-mysql2/issues/3148
 */

/**
 * By providing gracefulEnd when creating the pool, the end method of a pooled connection
 * will actually close the connection instead of releasing it back to the pool.
 */
const pool = createPool({ gracefulEnd: true });
let warningEmitted = false;

pool.getConnection((_err1: Error | null, connection: PoolConnection) => {
  connection.on('warn', () => {
    warningEmitted = true;
  });

  connection.end();
  pool.end();
});

process.on('exit', () => {
  assert(!warningEmitted, 'Warning should not be emitted');
});

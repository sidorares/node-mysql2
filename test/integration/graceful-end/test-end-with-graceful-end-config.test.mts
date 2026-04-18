import type { PoolConnection } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createPool } from '../../common.test.mjs';

/**
 * This test case tests that the pool releases connections gracefully after the idle timeout has passed.
 *
 * @see https://github.com/sidorares/node-mysql2/issues/3148
 */

await describe('Pool end with gracefulEnd config', async () => {
  await describe('should not emit deprecation warning when gracefulEnd is true', async () => {
    const pool = createPool({ gracefulEnd: true });
    let warningEmitted = false;
    let callbackInvoked = false;

    const connection = await new Promise<PoolConnection>((resolve, reject) => {
      pool.getConnection((err: Error | null, conn: PoolConnection) => {
        if (err) return reject(err);
        resolve(conn);
      });
    });

    connection.on('warn', () => {
      warningEmitted = true;
    });

    await new Promise<void>((resolve) => {
      connection.end(() => {
        callbackInvoked = true;
        resolve();
      });
    });

    it('should not have emitted a warning', () => {
      strict(!warningEmitted, 'Warning should not be emitted');
    });

    it('should have invoked the callback', () => {
      strict(callbackInvoked, 'Callback should be invoked');
    });

    await pool.promise().end();
  });

  await describe('should remove connection from pool when gracefulEnd is true', async () => {
    const pool = createPool({ gracefulEnd: true });

    const connection = await new Promise<PoolConnection>((resolve, reject) => {
      pool.getConnection((err: Error | null, conn: PoolConnection) => {
        if (err) return reject(err);
        resolve(conn);
      });
    });

    it('should have 1 connection in pool', () => {
      // @ts-expect-error: internal access
      strict(pool._allConnections.length === 1, 'should have 1 connection');
    });

    await new Promise<void>((resolve) => {
      connection.end(() => resolve());
    });

    it('should have removed connection from pool', () => {
      strict(
        // @ts-expect-error: internal access
        pool._allConnections.length === 0,
        'connection should be removed from pool'
      );
    });

    await pool.promise().end();
  });
});

import type { PoolConnection } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createPool } from '../../common.test.mjs';

/**
 * This test case tests that the pool releases connections gracefully after the idle timeout has passed.
 *
 * @see https://github.com/sidorares/node-mysql2/issues/3148
 */

await describe('Pool end with gracefulEnd config', async () => {
  await it('should not emit deprecation warning when gracefulEnd is true', async () => {
    const pool = createPool({ gracefulEnd: true });
    let warningEmitted = false;
    let callbackInvoked = false;

    await new Promise<void>((resolve) => {
      pool.getConnection((_err1: Error | null, connection: PoolConnection) => {
        connection.on('warn', () => {
          warningEmitted = true;
        });

        connection.end(() => {
          callbackInvoked = true;
        });
        pool.end(() => resolve());
      });
    });

    strict(!warningEmitted, 'Warning should not be emitted');
    strict(callbackInvoked, 'Callback should be invoked');
  });

  await it('should remove connection from pool when gracefulEnd is true', async () => {
    const pool = createPool({ gracefulEnd: true });

    await new Promise<void>((resolve, reject) => {
      pool.getConnection((err: Error | null, connection: PoolConnection) => {
        if (err) return reject(err);

        // @ts-expect-error: internal access
        strict(pool._allConnections.length === 1, 'should have 1 connection');

        connection.end(() => {
          strict(
            // @ts-expect-error: internal access
            pool._allConnections.length === 0,
            'connection should be removed from pool'
          );
          pool.end(() => resolve());
        });
      });
    });
  });
});

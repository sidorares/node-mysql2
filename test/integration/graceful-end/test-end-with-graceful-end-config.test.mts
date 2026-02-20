import type { PoolConnection } from '../../../index.js';
import { assert, describe, it } from 'poku';
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

    assert(!warningEmitted, 'Warning should not be emitted');
    assert(callbackInvoked, 'Callback should be invoked');
  });
});

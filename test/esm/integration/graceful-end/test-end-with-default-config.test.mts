import type { PoolConnection } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createPool } from '../../common.test.mjs';

/**
 * This test case tests that the pool releases connections gracefully after the idle timeout has passed.
 *
 * @see https://github.com/sidorares/node-mysql2/issues/3148
 */

await describe('Pool end with default config', async () => {
  await it('should emit deprecation warning when calling conn.end()', async () => {
    const pool = createPool();
    let warningEmitted = false;

    await new Promise<void>((resolve) => {
      pool.getConnection((_err1: Error | null, connection: PoolConnection) => {
        connection.on('warn', (warning: Error) => {
          warningEmitted = true;
          assert(
            warning.message.startsWith(
              'Calling conn.end() to release a pooled connection is deprecated'
            )
          );
        });

        connection.end();
        pool.end(() => resolve());
      });
    });

    assert(warningEmitted, 'Warning should be emitted');
  });
});

import type { PoolConnection } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createPool } from '../../common.test.mjs';

/**
 * This test case tests that the pool releases connections gracefully after the idle timeout has passed.
 *
 * @see https://github.com/sidorares/node-mysql2/issues/3148
 */

await describe('Pool release idle with default config', async () => {
  await it('should not send quit command for idle connections', async () => {
    const pool = createPool({
      connectionLimit: 2,
      maxIdle: 1,
      idleTimeout: 500,
      debug: true,
    });

    let quitCommandReceived = false;
    const originalLog = console.log;
    console.log = (message: string) => {
      if (message === 'Add command: Quit') {
        quitCommandReceived = true;
      }
    };

    await new Promise<void>((resolve) => {
      pool.getConnection((_err1: Error | null, connection1: PoolConnection) => {
        pool.getConnection(
          (_err2: Error | null, connection2: PoolConnection) => {
            connection1.release();
            connection2.release();

            setTimeout(() => {
              pool.end(() => resolve());
            }, 2000);
          }
        );
      });
    });

    assert(!quitCommandReceived, 'quit command should not have been received');
    console.log = originalLog;
  });
});

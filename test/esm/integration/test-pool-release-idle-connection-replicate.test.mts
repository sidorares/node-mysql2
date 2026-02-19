import type { PoolConnection } from '../../../index.js';
import { assert, describe, it } from 'poku';
import { createPool } from '../common.test.mjs';

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

await describe('Pool Release Idle Connection Replicate', async () => {
  await it('should destroy idle connections after timeout', async () => {
    /**
     * This test case
     */
    const pool = createPool({
      connectionLimit: 3,
      maxIdle: 2,
      idleTimeout: 1000,
    });

    await new Promise<void>((resolve, reject) => {
      /**
       * Create the first connection and ensure it's in the pool as expected
       */
      pool.getConnection(
        (err1: NodeJS.ErrnoException | null, connection1: PoolConnection) => {
          if (err1) return reject(err1);
          assert.ok(connection1);

          /**
           * Create the second connection and ensure it's in the pool as expected
           */
          pool.getConnection(
            (
              err2: NodeJS.ErrnoException | null,
              connection2: PoolConnection
            ) => {
              if (err2) return reject(err2);
              assert.ok(connection2);

              /**
               * Create the third connection and ensure it's in the pool as expected
               */
              pool.getConnection(
                (
                  err3: NodeJS.ErrnoException | null,
                  connection3: PoolConnection
                ) => {
                  if (err3) return reject(err3);
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
                      // @ts-expect-error: internal access
                      pool._allConnections.length === 0,
                      // @ts-expect-error: internal access
                      `Expected all connections to be closed, but found ${pool._allConnections.length}`
                    );
                    assert(
                      // @ts-expect-error: internal access
                      pool._freeConnections.length === 0,
                      // @ts-expect-error: internal access
                      `Expected all free connections to be closed, but found ${pool._freeConnections.length}`
                    );

                    pool.end();
                    resolve();
                  }, 5000);
                }
              );
            }
          );
        }
      );
    });
  });
});

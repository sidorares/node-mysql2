import type { PoolConnection } from '../../index.js';
import { describe, it, strict } from 'poku';
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
  const pool = createPool({
    connectionLimit: 3,
    maxIdle: 2,
    idleTimeout: 1000,
  });

  let allConnsAfterTimeout = -1;
  let freeConnsAfterTimeout = -1;

  await it('should destroy idle connections after timeout', async () => {
    await new Promise<void>((resolve, reject) => {
      pool.getConnection(
        (err1: NodeJS.ErrnoException | null, connection1: PoolConnection) => {
          if (err1) return reject(err1);

          pool.getConnection(
            (
              err2: NodeJS.ErrnoException | null,
              connection2: PoolConnection
            ) => {
              if (err2) return reject(err2);

              pool.getConnection(
                (
                  err3: NodeJS.ErrnoException | null,
                  connection3: PoolConnection
                ) => {
                  if (err3) return reject(err3);

                  connection1.release();
                  connection2.release();
                  connection3.release();

                  setTimeout(() => {
                    // @ts-expect-error: internal access
                    allConnsAfterTimeout = pool._allConnections.length;
                    // @ts-expect-error: internal access
                    freeConnsAfterTimeout = pool._freeConnections.length;

                    pool.end(() => resolve());
                  }, 5000);
                }
              );
            }
          );
        }
      );
    });
  });

  it('should have no connections in the pool', () => {
    strict(
      allConnsAfterTimeout === 0,
      `Expected all connections to be closed, but found ${allConnsAfterTimeout}`
    );
    strict(
      freeConnsAfterTimeout === 0,
      `Expected all free connections to be closed, but found ${freeConnsAfterTimeout}`
    );
  });
});

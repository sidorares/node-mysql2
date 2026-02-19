import type { PoolConnection } from '../../../index.js';
import { assert, describe, it } from 'poku';
import { createPool } from '../common.test.mjs';

await describe('Pool Release Idle Connection Timeout', async () => {
  await it('should destroy all idle connections after timeout', async () => {
    const pool = createPool({
      connectionLimit: 3,
      maxIdle: 1,
      idleTimeout: 1000,
    });

    await new Promise<void>((resolve, reject) => {
      pool.getConnection(
        (err1: NodeJS.ErrnoException | null, connection1: PoolConnection) => {
          if (err1) return reject(err1);
          assert.ok(connection1);
          pool.getConnection(
            (
              err2: NodeJS.ErrnoException | null,
              connection2: PoolConnection
            ) => {
              if (err2) return reject(err2);
              assert.ok(connection2);
              assert.notStrictEqual(connection1, connection2);
              pool.getConnection(
                (
                  err3: NodeJS.ErrnoException | null,
                  connection3: PoolConnection
                ) => {
                  if (err3) return reject(err3);
                  assert.ok(connection3);
                  assert.notStrictEqual(connection1, connection3);
                  assert.notStrictEqual(connection2, connection3);
                  connection1.release();
                  connection2.release();
                  connection3.release();
                  // @ts-expect-error: internal access
                  assert(pool._allConnections.length === 3);
                  // @ts-expect-error: internal access
                  assert(pool._freeConnections.length === 3);
                  // after two seconds, the above 3 connection should have been destroyed
                  setTimeout(() => {
                    // @ts-expect-error: internal access
                    assert(pool._allConnections.length === 0);
                    // @ts-expect-error: internal access
                    assert(pool._freeConnections.length === 0);
                    // Creating a new connection should create a fresh one
                    pool.getConnection(
                      (
                        err4: NodeJS.ErrnoException | null,
                        connection4: PoolConnection
                      ) => {
                        if (err4) return reject(err4);
                        assert.ok(connection4);
                        // @ts-expect-error: internal access
                        assert(pool._allConnections.length === 1);
                        // @ts-expect-error: internal access
                        assert(pool._freeConnections.length === 0);
                        connection4.release();
                        connection4.destroy();
                        pool.end();
                        resolve();
                      }
                    );
                  }, 2000);
                }
              );
            }
          );
        }
      );
    });
  });
});

import type { PoolConnection } from '../../index.js';
import { describe, it, strict } from 'poku';
import { createPool } from '../common.test.mjs';

await describe('Pool Release Idle Connection', async () => {
  const pool = createPool({
    connectionLimit: 5,
    maxIdle: 1,
    idleTimeout: 5000,
  });

  let connection1!: PoolConnection;
  let connection2!: PoolConnection;
  let connection3!: PoolConnection;
  let connection4!: PoolConnection;
  let allConnsAfterRelease = -1;
  let freeConnsAfterRelease = -1;
  let allConnsAfterTimeout = -1;
  let freeConnsAfterTimeout = -1;
  let allConnsAfterReuse = -1;
  let freeConnsAfterReuse = -1;

  await it('should release idle connections after timeout', async () => {
    await new Promise<void>((resolve, reject) => {
      pool.getConnection(
        (err1: NodeJS.ErrnoException | null, conn1: PoolConnection) => {
          if (err1) return reject(err1);
          connection1 = conn1;

          pool.getConnection(
            (err2: NodeJS.ErrnoException | null, conn2: PoolConnection) => {
              if (err2) return reject(err2);
              connection2 = conn2;

              pool.getConnection(
                (err3: NodeJS.ErrnoException | null, conn3: PoolConnection) => {
                  if (err3) return reject(err3);
                  connection3 = conn3;

                  conn1.release();
                  conn2.release();
                  conn3.release();

                  // @ts-expect-error: internal access
                  allConnsAfterRelease = pool._allConnections.length;
                  // @ts-expect-error: internal access
                  freeConnsAfterRelease = pool._freeConnections.length;

                  setTimeout(() => {
                    // @ts-expect-error: internal access
                    allConnsAfterTimeout = pool._allConnections.length;
                    // @ts-expect-error: internal access
                    freeConnsAfterTimeout = pool._freeConnections.length;

                    pool.getConnection(
                      (
                        err4: NodeJS.ErrnoException | null,
                        conn4: PoolConnection
                      ) => {
                        if (err4) return reject(err4);
                        connection4 = conn4;

                        // @ts-expect-error: internal access
                        allConnsAfterReuse = pool._allConnections.length;
                        // @ts-expect-error: internal access
                        freeConnsAfterReuse = pool._freeConnections.length;

                        conn4.release();
                        conn4.destroy();
                        pool.end(() => resolve());
                      }
                    );
                  }, 4000);
                }
              );
            }
          );
        }
      );
    });
  });

  it('should have 2 connections in the pool', () => {
    strict(connection2);
    strict.notStrictEqual(connection1, connection2);
  });

  it('should have 3 connections in the pool', () => {
    strict(connection3);
    strict.notStrictEqual(connection1, connection3);
    strict.notStrictEqual(connection2, connection3);
  });

  it('should have 3 free connections in the pool', () => {
    strict(allConnsAfterRelease === 3);
    strict(freeConnsAfterRelease === 3);
  });

  it('should have 1 connection in the pool after idle timeout', () => {
    strict(allConnsAfterTimeout === 1);
    strict(freeConnsAfterTimeout === 1);
  });

  it('should reuse the remaining idle connection', () => {
    strict(connection4);
    strict.strictEqual(connection3, connection4);
    strict(allConnsAfterReuse === 1);
    strict(freeConnsAfterReuse === 0);
  });
});

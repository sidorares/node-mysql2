import type { PoolConnection } from '../../index.js';
import { describe, it, strict } from 'poku';
import { createPool } from '../common.test.mjs';

await describe('Pool Release Idle Connection Timeout', async () => {
  const pool = createPool({
    connectionLimit: 3,
    maxIdle: 1,
    idleTimeout: 1000,
  });

  let connection1!: PoolConnection;
  let connection2!: PoolConnection;
  let connection3!: PoolConnection;
  let connection4!: PoolConnection;
  let allConnsAfterRelease = -1;
  let freeConnsAfterRelease = -1;
  let allConnsAfterTimeout = -1;
  let freeConnsAfterTimeout = -1;
  let allConnsAfterNew = -1;
  let freeConnsAfterNew = -1;

  await it('should destroy all idle connections after timeout', async () => {
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

                  // after two seconds, the above 3 connections should have been destroyed
                  setTimeout(() => {
                    // @ts-expect-error: internal access
                    allConnsAfterTimeout = pool._allConnections.length;
                    // @ts-expect-error: internal access
                    freeConnsAfterTimeout = pool._freeConnections.length;

                    // Creating a new connection should create a fresh one
                    pool.getConnection(
                      (
                        err4: NodeJS.ErrnoException | null,
                        conn4: PoolConnection
                      ) => {
                        if (err4) return reject(err4);
                        connection4 = conn4;

                        // @ts-expect-error: internal access
                        allConnsAfterNew = pool._allConnections.length;
                        // @ts-expect-error: internal access
                        freeConnsAfterNew = pool._freeConnections.length;

                        conn4.release();
                        conn4.destroy();
                        pool.end(() => resolve());
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

  it('should have no connections in the pool', () => {
    strict(allConnsAfterTimeout === 0);
    strict(freeConnsAfterTimeout === 0);
  });

  it('should create a new connection after idle timeout', () => {
    strict(connection4);
    strict(allConnsAfterNew === 1);
    strict(freeConnsAfterNew === 0);
  });
});

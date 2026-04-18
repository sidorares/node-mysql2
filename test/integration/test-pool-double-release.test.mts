import type { PoolConnection } from '../../index.js';
import { describe, it, strict } from 'poku';
import { createPool } from '../common.test.mjs';

await describe('Pool Double Release', async () => {
  await describe('should not duplicate _freeConnections on double release', async () => {
    const pool = createPool({
      connectionLimit: 5,
      maxIdle: 5,
      idleTimeout: 15000,
    });

    let freeConnectionsLength = -1;

    await new Promise<void>((resolve, reject) => {
      pool.getConnection(
        (err: NodeJS.ErrnoException | null, connection: PoolConnection) => {
          if (err) return reject(err);

          connection.release();
          connection.release();

          // @ts-expect-error: internal access
          freeConnectionsLength = pool._freeConnections.length;
          resolve();
        }
      );
    });

    it('should have exactly 1 free connection, not 2', () => {
      strict.equal(freeConnectionsLength, 1);
    });

    await pool.promise().end();
  });

  await describe('should not give the same connection to two different handlers', async () => {
    const pool = createPool({
      connectionLimit: 2,
      idleTimeout: 15000,
    });

    let conn1!: PoolConnection;
    let conn2!: PoolConnection;

    await new Promise<void>((resolve, reject) => {
      pool.getConnection(
        (err: NodeJS.ErrnoException | null, connection: PoolConnection) => {
          if (err) return reject(err);

          connection.release();
          connection.release();

          pool.getConnection(
            (err1: NodeJS.ErrnoException | null, c1: PoolConnection) => {
              if (err1) return reject(err1);
              conn1 = c1;

              pool.getConnection(
                (err2: NodeJS.ErrnoException | null, c2: PoolConnection) => {
                  if (err2) return reject(err2);
                  conn2 = c2;

                  conn1.release();
                  conn2.release();
                  resolve();
                }
              );
            }
          );
        }
      );
    });

    it('should return unique connections', () => {
      strict.notStrictEqual(conn1, conn2);
    });

    await pool.promise().end();
  });

  await describe('should not have duplicate references in _freeConnections after double release', async () => {
    const pool = createPool({
      connectionLimit: 3,
      maxIdle: 3,
      idleTimeout: 15000,
    });

    let hasDuplicates = true;

    await new Promise<void>((resolve, reject) => {
      pool.getConnection(
        (err1: NodeJS.ErrnoException | null, c1: PoolConnection) => {
          if (err1) return reject(err1);

          pool.getConnection(
            (err2: NodeJS.ErrnoException | null, c2: PoolConnection) => {
              if (err2) return reject(err2);

              c1.release();
              c1.release();
              c2.release();
              c2.release();

              // @ts-expect-error: internal access
              const freeConns = pool._freeConnections;
              const seen = new Set();
              hasDuplicates = false;
              for (let i = 0; i < freeConns.length; i++) {
                const conn = freeConns.get(i);
                if (seen.has(conn)) {
                  hasDuplicates = true;
                  break;
                }
                seen.add(conn);
              }

              resolve();
            }
          );
        }
      );
    });

    it('should have no duplicate connection references', () => {
      strict.equal(hasDuplicates, false);
    });

    await pool.promise().end();
  });
});

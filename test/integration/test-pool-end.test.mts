import { describe, it, strict } from 'poku';
import { createPool } from '../common.test.mjs';

await describe('Pool End', async () => {
  const pool = createPool();

  await it('should handle pool end correctly', async () => {
    await new Promise<void>((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) return reject(err);

        // @ts-expect-error: internal access
        strict(pool._allConnections.length === 1);
        // @ts-expect-error: internal access
        strict(pool._freeConnections.length === 0);

        // emit the end event, so the connection gets removed from the pool
        // @ts-expect-error: internal access
        conn.stream.emit('end');

        // @ts-expect-error: internal access
        strict(pool._allConnections.length === 0);
        // @ts-expect-error: internal access
        strict(pool._freeConnections.length === 0);

        // As the connection has not really ended we need to do this ourselves
        conn.destroy();
        resolve();
      });
    });
  });

  pool.end();
});

await describe('Pool end should close all connections and mark as closed', async () => {
  const pool = createPool();

  await it('should close all connections and mark pool as closed', async () => {
    await new Promise<void>((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) return reject(err);
        conn.release();

        pool.end((endErr) => {
          if (endErr) return reject(endErr);
          resolve();
        });
      });
    });

    // @ts-expect-error: internal access
    strict(pool._closed === true, 'pool should be closed');
  });
});

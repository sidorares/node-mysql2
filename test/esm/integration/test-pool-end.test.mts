import { assert, describe, it } from 'poku';
import { createPool } from '../common.test.mjs';

await describe('Pool End', async () => {
  await it('should handle pool end correctly', async () => {
    const pool = createPool();

    await new Promise<void>((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) return reject(err);

        // @ts-expect-error: internal access
        assert(pool._allConnections.length === 1);
        // @ts-expect-error: internal access
        assert(pool._freeConnections.length === 0);

        // emit the end event, so the connection gets removed from the pool
        // @ts-expect-error: internal access
        conn.stream.emit('end');

        // @ts-expect-error: internal access
        assert(pool._allConnections.length === 0);
        // @ts-expect-error: internal access
        assert(pool._freeConnections.length === 0);

        // As the connection has not really ended we need to do this ourselves
        conn.destroy();
        resolve();
      });
    });
  });
});

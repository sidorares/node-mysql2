import type { Pool, PoolConnection } from '../../index.js';
import { assert, describe, it } from 'poku';
import { createPool } from '../common.test.mjs';

/** Returns the raw `PoolConnection` with access to `EventEmitter` listeners. */
const getConnection = (pool: Pool) =>
  new Promise<PoolConnection>((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) return reject(err);
      resolve(conn);
    });
  });

await describe('Pool Memory Leak (issue #3904)', async () => {
  await it('should not retain stale connect/error listeners after pool connection is established', async () => {
    const pool = createPool({ connectionLimit: 1 });
    const conn = await getConnection(pool);

    try {
      const errorListenerCount = conn.listenerCount('error');

      assert.strictEqual(
        errorListenerCount,
        1,
        `Expected 1 error listener, but found ${errorListenerCount}.`
      );
    } finally {
      conn.release();
      await pool.promise().end();
    }
  });

  await it('should not accumulate listeners across multiple pool.query calls', async () => {
    const pool = createPool({ connectionLimit: 1 });
    const promisePool = pool.promise();

    await promisePool.query('SELECT 1');

    const conn = await getConnection(pool);

    try {
      const errorListeners = conn.listenerCount('error');
      const connectListeners = conn.listenerCount('connect');

      assert.strictEqual(
        errorListeners,
        1,
        `Expected 1 error listener after queries, but found ${errorListeners}.`
      );

      assert.strictEqual(
        connectListeners,
        0,
        `Expected 0 connect listeners, but found ${connectListeners}.`
      );
    } finally {
      conn.release();
      await promisePool.end();
    }
  });

  await it('should release query result references after query completes', async () => {
    const pool = createPool({ connectionLimit: 1 });
    const promisePool = pool.promise();

    await promisePool.query(
      'SELECT REPEAT("x", 1024) AS padding FROM (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) t'
    );

    const conn = await getConnection(pool);

    try {
      const errorListeners = conn.rawListeners('error');

      const hasStaleListener = errorListeners.some((listener) => {
        // @ts-expect-error: TODO: implement typings
        const original = listener.listener ?? listener;
        return original.toString().includes('connectCalled');
      });

      assert(
        !hasStaleListener,
        'Found a stale callbackOnce error listener that retains query result references.'
      );
    } finally {
      conn.release();
      await promisePool.end();
    }
  });
});

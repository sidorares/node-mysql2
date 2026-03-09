import type { Pool, PoolConnection } from '../../index.js';
import { describe, it, strict } from 'poku';
import { createPool } from '../common.test.mjs';

/** Returns the raw `PoolConnection` with access to `EventEmitter` listeners. */
const getConnection = (pool: Pool) =>
  new Promise<PoolConnection>((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) return reject(err);
      resolve(conn);
    });
  });

await describe('Pool Memory Leak: single connection (issue #3904)', async () => {
  const pool = createPool({ connectionLimit: 1 });

  await it('should not retain stale connect/error listeners after pool connection is established', async () => {
    const conn = await getConnection(pool);
    const errorListenerCount = conn.listenerCount('error');
    conn.release();

    strict.strictEqual(
      errorListenerCount,
      1,
      `Expected 1 error listener, but found ${errorListenerCount}.`
    );
  });

  await pool.promise().end();
});

await describe('Pool Memory Leak: multiple queries (issue #3904)', async () => {
  const pool = createPool({ connectionLimit: 1 });
  const promisePool = pool.promise();

  await it('should not accumulate listeners across multiple pool.query calls', async () => {
    await promisePool.query('SELECT 1');

    const conn = await getConnection(pool);
    const errorListeners = conn.listenerCount('error');
    const connectListeners = conn.listenerCount('connect');
    conn.release();

    strict.strictEqual(
      errorListeners,
      1,
      `Expected 1 error listener after queries, but found ${errorListeners}.`
    );

    strict.strictEqual(
      connectListeners,
      0,
      `Expected 0 connect listeners, but found ${connectListeners}.`
    );
  });

  await promisePool.end();
});

await describe('Pool Memory Leak: result references (issue #3904)', async () => {
  const pool = createPool({ connectionLimit: 1 });
  const promisePool = pool.promise();

  await it('should release query result references after query completes', async () => {
    await promisePool.query(
      'SELECT REPEAT("x", 1024) AS padding FROM (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) t'
    );

    const conn = await getConnection(pool);
    const errorListeners = conn.rawListeners('error');
    conn.release();

    const hasStaleListener = errorListeners.some((listener) => {
      // @ts-expect-error: TODO: implement typings
      const original = listener.listener ?? listener;
      return original.toString().includes('connectCalled');
    });

    strict(
      !hasStaleListener,
      'Found a stale callbackOnce error listener that retains query result references.'
    );
  });

  await promisePool.end();
});

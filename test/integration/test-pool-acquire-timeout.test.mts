import type { PoolConnection } from '../../index.js';
import { assert, describe, it } from 'poku';
import driver from '../../index.js';
import { config } from '../common.test.mjs';

await describe('Pool acquireTimeout', async () => {
  await describe('configuration', async () => {
    const defaultPool = driver.createPool({ ...config, connectionLimit: 1 });
    const defaultTimeout = defaultPool.config.acquireTimeout;
    await defaultPool.promise().end();

    const customPool = driver.createPool({ ...config, acquireTimeout: 1234 });
    const customTimeout = customPool.config.acquireTimeout;
    await customPool.promise().end();

    it('should default to 0 (disabled)', () => {
      assert.strictEqual(defaultTimeout, 0);
    });

    it('should store a custom value', () => {
      assert.strictEqual(customTimeout, 1234);
    });
  });

  await describe('when the queue wait exceeds the timeout', async () => {
    const pool = driver.createPool({
      ...config,
      connectionLimit: 1,
      acquireTimeout: 150,
    });
    const held = await pool.promise().getConnection();

    const err = await new Promise<Error | null>((resolve) => {
      const fallback = setTimeout(() => resolve(null), 3000);
      pool.getConnection((e) => {
        clearTimeout(fallback);
        resolve(e || null);
      });
    });

    // @ts-expect-error: internal access
    const queuedAfterTimeout = pool._connectionQueue.length;

    held.release();

    // @ts-expect-error: internal access
    const freeAfterRelease = pool._freeConnections.length;

    const reacquired = await pool.promise().getConnection();
    const usableAfterTimeout = typeof reacquired.threadId === 'number';
    reacquired.release();

    await pool.promise().end();

    it('should reject the queued acquisition with a timeout error', () => {
      assert.ok(err instanceof Error, 'should receive an error');
      assert.ok(
        (err as Error).message.includes('timed out'),
        'error should mention the timeout'
      );
    });

    it('should free the queued callback from the connection queue', () => {
      assert.strictEqual(queuedAfterTimeout, 0);
    });

    it('should return the released connection to the free pool', () => {
      assert.strictEqual(freeAfterRelease, 1);
    });

    it('should remain usable after a timeout', () => {
      assert.ok(usableAfterTimeout);
    });
  });

  await describe('disabled by default', async () => {
    const pool = driver.createPool({ ...config, connectionLimit: 1 });
    const held = await pool.promise().getConnection();

    let waiterErr: Error | null = null;
    let waiterGotConnection = false;
    const waiter = new Promise<void>((resolve) => {
      pool.getConnection((e, conn: PoolConnection) => {
        waiterErr = e || null;
        waiterGotConnection = Boolean(conn);
        if (conn) conn.release();
        resolve();
      });
    });

    held.release();
    await waiter;
    await pool.promise().end();

    it('should serve a queued acquisition without a timeout error', () => {
      assert.strictEqual(waiterErr, null);
      assert.ok(waiterGotConnection);
    });
  });
});

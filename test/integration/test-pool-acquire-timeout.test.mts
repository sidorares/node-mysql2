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
      pool.getConnection((e, conn) => {
        clearTimeout(fallback);
        conn?.release();
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

    it('should tag the error with the POOL_ACQUIRE_TIMEOUT code', () => {
      assert.strictEqual(
        (err as Error & { code?: string }).code,
        'POOL_ACQUIRE_TIMEOUT'
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

  await describe('when a connection frees before the timeout', async () => {
    const pool = driver.createPool({
      ...config,
      connectionLimit: 1,
      acquireTimeout: 2000,
    });
    const held = await pool.promise().getConnection();

    let waiterErr: Error | null = null;
    let waiterGotConnection = false;
    const waiter = new Promise<void>((resolve) => {
      pool.getConnection((e, conn: PoolConnection) => {
        waiterErr = e || null;
        waiterGotConnection = Boolean(conn);
        conn?.release();
        resolve();
      });
    });

    held.release();
    await waiter;

    // @ts-expect-error: internal access
    const queuedAfter = pool._connectionQueue.length;

    await pool.promise().end();

    it('should serve the waiter and disarm the timeout', () => {
      assert.strictEqual(waiterErr, null);
      assert.ok(waiterGotConnection);
      assert.strictEqual(queuedAfter, 0);
    });
  });

  await describe('when the held connection is destroyed while a request waits', async () => {
    const pool = driver.createPool({
      ...config,
      connectionLimit: 1,
      acquireTimeout: 2000,
    });
    const held = await pool.promise().getConnection();

    let waiterErr: Error | null = null;
    let waiterGotConnection = false;
    const waiter = new Promise<void>((resolve) => {
      pool.getConnection((e, conn: PoolConnection) => {
        waiterErr = e || null;
        waiterGotConnection = Boolean(conn);
        conn?.release();
        resolve();
      });
    });

    // Removing the only connection dequeues the waiter to be re-served with a
    // fresh connection; its acquireTimeout must be disarmed on the way out.
    held.destroy();
    await waiter;

    // @ts-expect-error: internal access
    const queuedAfter = pool._connectionQueue.length;

    await pool.promise().end();

    it('should re-serve the waiter without a timeout error', () => {
      assert.strictEqual(waiterErr, null);
      assert.ok(waiterGotConnection);
      assert.strictEqual(queuedAfter, 0);
    });
  });

  await describe('under connection churn', async () => {
    const acquireTimeout = 300;
    const pool = driver.createPool({
      ...config,
      connectionLimit: 1,
      acquireTimeout,
    });

    const outcome = await new Promise<{ ms: number; code?: string }>(
      (resolve) => {
        pool.getConnection((err, holder: PoolConnection) => {
          if (err) return resolve({ ms: -1 });

          const start = Date.now();
          let current = holder;
          let done = false;

          pool.getConnection((e, conn: PoolConnection) => {
            done = true;
            conn?.release();
            resolve({
              ms: Date.now() - start,
              code: (e as Error & { code?: string })?.code,
            });
          });

          // Repeatedly steal the freed slot so the waiter keeps re-entering
          // getConnection; the absolute deadline must still bound the wait.
          let iterations = 0;
          const churn = setInterval(() => {
            if (done || iterations >= 8) {
              clearInterval(churn);
              return;
            }
            iterations++;
            current.destroy();
            pool.getConnection((_e, stolen: PoolConnection) => {
              if (stolen) current = stolen;
            });
          }, 150);
        });
      }
    );

    await pool.promise().end();

    it('should time out at the deadline despite re-entry', () => {
      assert.strictEqual(outcome.code, 'POOL_ACQUIRE_TIMEOUT');
      assert.ok(
        outcome.ms < acquireTimeout * 3,
        `waited ${outcome.ms}ms, expected the wait to stay near ${acquireTimeout}ms`
      );
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
        conn?.release();
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

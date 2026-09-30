import { describe, it, strict } from 'poku';
import { createPool } from '../common.test.mjs';

/**
 * This test case tests that `idleTimeout` is honored when `maxIdle` keeps its
 * default value, which is `connectionLimit`.
 *
 * @see https://github.com/sidorares/node-mysql2/issues/2493
 */

await describe('Pool Release Idle Connection With Default maxIdle', async () => {
  const pool = createPool({ connectionLimit: 3, idleTimeout: 1000 });
  const promisePool = pool.promise();
  const connection = await promisePool.getConnection();

  await connection.query('SELECT 1');
  connection.release();

  // @ts-expect-error: internal access
  const sweeperStarted = Boolean(pool._removeIdleTimeoutConnectionsTimer);
  // @ts-expect-error: internal access
  const freeConnsAfterRelease = pool._freeConnections.length;

  // @ts-expect-error: internal access
  pool._freeConnections.get(0).lastActiveTime = Date.now() - 2000;
  // @ts-expect-error: internal access
  pool._destroyIdleConnections();

  // @ts-expect-error: internal access
  const allConnsAfterSweep = pool._allConnections.length;
  // @ts-expect-error: internal access
  const freeConnsAfterSweep = pool._freeConnections.length;

  it('should start the idle sweeper when a connection is released', () => {
    strict.ok(sweeperStarted, 'sweeper timer should be running');
    strict.equal(freeConnsAfterRelease, 1);
  });

  it('should destroy a connection idle for longer than idleTimeout', () => {
    strict.equal(freeConnsAfterSweep, 0);
    strict.equal(allConnsAfterSweep, 0);
  });

  await promisePool.end();
});

await describe('Pool Release Idle Connection With An Unlimited Pool', async () => {
  const pool = createPool({ connectionLimit: 0 });
  const promisePool = pool.promise();
  const connection = await promisePool.getConnection();

  await connection.query('SELECT 1');
  connection.release();

  // @ts-expect-error: internal access
  pool._destroyIdleConnections();

  // @ts-expect-error: internal access
  const freeConns = pool._freeConnections.length;
  // @ts-expect-error: internal access
  const allConns = pool._allConnections.length;

  it('should keep a freshly released connection when connectionLimit is unlimited', () => {
    strict.equal(freeConns, 1);
    strict.equal(allConns, 1);
  });

  await promisePool.end();
});

await describe('Pool Idle Sweeper Delay', async () => {
  const pool = createPool({ connectionLimit: 3, idleTimeout: 60000 });
  const promisePool = pool.promise();
  const connection = await promisePool.getConnection();

  connection.release();

  // @ts-expect-error: internal access
  const delayAfterRelease = pool._nextIdleSweepDelay();

  // @ts-expect-error: internal access
  pool._freeConnections.get(0).lastActiveTime = Date.now() - 60000;
  // @ts-expect-error: internal access
  const delayAtIdleTimeout = pool._nextIdleSweepDelay();

  it('should sweep at least once a second while connections are idle', () => {
    strict.equal(delayAfterRelease, 1000);
  });

  it('should sweep right away once the oldest idle connection reaches idleTimeout', () => {
    strict.ok(
      delayAtIdleTimeout <= 1,
      `expected <= 1, got ${delayAtIdleTimeout}`
    );
  });

  await promisePool.end();
});

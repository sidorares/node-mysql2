import type { Pool, PoolConnection } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createPool } from '../../common.test.mjs';

const acquire = (pool: Pool) =>
  new Promise<PoolConnection>((resolve, reject) => {
    pool.getConnection((err, connection) =>
      err ? reject(err) : resolve(connection)
    );
  });

const expiresAt = (connection: PoolConnection): number => {
  // @ts-expect-error: internal access
  return connection._expiresAt;
};

const expire = (connection: PoolConnection) => {
  // @ts-expect-error: internal access
  connection._expiresAt = 0;
};

const watchDestroy = (connection: PoolConnection) => {
  const state = { destroyed: false };
  const destroy = connection.destroy.bind(connection);

  connection.destroy = () => {
    state.destroyed = true;
    destroy();
  };

  return state;
};

const isClosing = (connection: PoolConnection): boolean => {
  // @ts-expect-error: internal access
  return connection._closing === true;
};

const poolSize = (pool: Pool) => ({
  // @ts-expect-error: internal access
  all: pool._allConnections.length,
  // @ts-expect-error: internal access
  free: pool._freeConnections.length,
});

await describe('Pool maxLifetime', async () => {
  await describe('without maxLifetime', async () => {
    const pool = createPool({ connectionLimit: 1 });

    await it('should keep reusing the same connection', async () => {
      const first = await acquire(pool);

      strict.equal(pool.config.maxLifetime, 0);
      strict.equal(expiresAt(first), Infinity);

      first.release();
      const second = await acquire(pool);

      strict.equal(second.threadId, first.threadId);
      second.release();
    });

    await pool.promise().end();
  });

  await describe('lifetime deadline', async () => {
    const maxLifetime = 60000;
    const pool = createPool({ connectionLimit: 1, maxLifetime });

    await it('should expire within the jitter window of maxLifetime', async () => {
      const before = Date.now();
      const connection = await acquire(pool);
      const after = Date.now();

      strict.ok(expiresAt(connection) <= after + maxLifetime);
      strict.ok(expiresAt(connection) >= before + maxLifetime * 0.95);
      connection.release();
    });

    await pool.promise().end();
  });

  await describe('expired free connection', async () => {
    const pool = createPool({ connectionLimit: 2, maxLifetime: 60000 });

    await it('should be replaced instead of handed out', async () => {
      const first = await acquire(pool);
      const firstWatch = watchDestroy(first);

      first.release();
      expire(first);

      const second = await acquire(pool);

      strict.notEqual(second.threadId, first.threadId);
      strict.equal(firstWatch.destroyed, true);
      strict.deepEqual(poolSize(pool), { all: 1, free: 0 });
      second.release();
    });

    await pool.promise().end();
  });

  await describe('expired connection released to a queued request', async () => {
    const pool = createPool({ connectionLimit: 1, maxLifetime: 60000 });

    await it('should hand the request a new connection', async () => {
      const first = await acquire(pool);
      const firstWatch = watchDestroy(first);
      const queued = acquire(pool);

      expire(first);
      first.release();

      const second = await queued;

      strict.notEqual(second.threadId, first.threadId);
      strict.equal(firstWatch.destroyed, true);
      strict.deepEqual(poolSize(pool), { all: 1, free: 0 });
      second.release();
    });

    await pool.promise().end();
  });

  await describe('expired connection in use', async () => {
    const pool = createPool({ connectionLimit: 1, maxLifetime: 60000 });

    await it('should keep working until released, then close', async () => {
      const connection = await acquire(pool);
      const watched = watchDestroy(connection);

      expire(connection);

      const [rows] = await connection.promise().query('SELECT 1 AS ok');

      strict.deepEqual(rows, [{ ok: 1 }]);
      strict.equal(watched.destroyed, false);

      connection.release();

      strict.equal(watched.destroyed, true);
      strict.deepEqual(poolSize(pool), { all: 0, free: 0 });
    });

    await pool.promise().end();
  });

  await describe('expired connection with gracefulEnd', async () => {
    const pool = createPool({
      connectionLimit: 1,
      maxLifetime: 60000,
      gracefulEnd: true,
    });

    await it('should close with COM_QUIT instead of destroying the socket', async () => {
      const connection = await acquire(pool);
      const watched = watchDestroy(connection);

      expire(connection);
      connection.release();

      strict.equal(watched.destroyed, false);
      strict.equal(isClosing(connection), true);
      strict.deepEqual(poolSize(pool), { all: 0, free: 0 });
    });

    await pool.promise().end();
  });
});

import type { Pool, PoolConnection, RowDataPacket } from '../../../../index.js';
import { assert, describe, it, skip } from 'poku';
import { createPool } from '../../../common.test.mjs';

if (!('dispose' in Symbol)) {
  skip('Symbol.dispose is not supported in this runtime');
}

const getConnection = (pool: Pool) =>
  new Promise<PoolConnection>((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) return reject(err);
      resolve(conn);
    });
  });

const query = (conn: PoolConnection, sql: string) =>
  new Promise<RowDataPacket[]>((resolve, reject) => {
    conn.query<RowDataPacket[]>(sql, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

await describe('PoolConnection should implement Symbol.dispose', async () => {
  using pool = createPool({ connectionLimit: 1 });
  using conn = await getConnection(pool);

  it('should be a function', () => {
    assert.strictEqual(typeof conn[Symbol.dispose], 'function');
  });
});

await describe('using should release the connection back to the pool', async () => {
  using pool = createPool({ connectionLimit: 1 });

  await it('should use and dispose the connection', async () => {
    using conn = await getConnection(pool);
    const rows = await query(conn, 'SELECT 1');

    assert.deepStrictEqual(rows, [{ 1: 1 }]);
  });

  it('should have returned the connection to the free pool', () => {
    // @ts-expect-error: internal access
    assert.strictEqual(pool._freeConnections.length, 1);
  });
});

await describe('Pool should serve a new connection after using releases the previous one', async () => {
  using pool = createPool({ connectionLimit: 1 });

  await it('should use and dispose the first connection', async () => {
    using conn = await getConnection(pool);
    const rows = await query(conn, 'SELECT 1');

    assert.deepStrictEqual(rows, [{ 1: 1 }]);
  });

  await it('should use and dispose the second connection', async () => {
    using conn = await getConnection(pool);
    const rows = await query(conn, 'SELECT 1');

    assert.deepStrictEqual(rows, [{ 1: 1 }]);
  });

  it('should have served both connections with a single pool slot', () => {
    // @ts-expect-error: internal access
    assert.strictEqual(pool._allConnections.length, 1);
  });
});

await describe('dispose should release the connection', async () => {
  using pool = createPool({ connectionLimit: 1 });
  using conn = await getConnection(pool);
  const rows = await query(conn, 'SELECT 1');

  conn[Symbol.dispose]();

  it('should have received the query result', () => {
    assert.deepStrictEqual(rows, [{ 1: 1 }]);
  });

  it('should have returned the connection to the free pool', () => {
    // @ts-expect-error: internal access
    assert.strictEqual(pool._freeConnections.length, 1);
  });
});

await describe('using should handle manual `destroy` before automatic dispose', async () => {
  using pool = createPool({ connectionLimit: 1 });

  await it('should not error when connection is destroyed within using', async () => {
    using conn = await getConnection(pool);
    const rows = await query(conn, 'SELECT 1');

    conn.destroy();
    assert.deepStrictEqual(rows, [{ 1: 1 }]);
  });

  it('should have removed the destroyed connection from the pool', () => {
    // @ts-expect-error: internal access
    assert.strictEqual(pool._allConnections.length, 0);
  });
});

await describe('Pool should implement Symbol.dispose', async () => {
  using pool = createPool({ connectionLimit: 1 });

  it('should be a function', () => {
    assert.strictEqual(typeof pool[Symbol.dispose], 'function');
  });
});

await describe('dispose should end the pool', async () => {
  using pool = createPool({ connectionLimit: 1 });

  await it('should query and release the connection', async () => {
    using conn = await getConnection(pool);
    const rows = await query(conn, 'SELECT 1');

    assert.deepStrictEqual(rows, [{ 1: 1 }]);
  });

  pool[Symbol.dispose]();

  it('should have closed the pool', () => {
    // @ts-expect-error: internal access
    assert.strictEqual(pool._closed, true);
  });
});

await describe('dispose should handle manual end before dispose on pool', async () => {
  using pool = createPool({ connectionLimit: 1 });

  await pool.promise().end();
  pool[Symbol.dispose]();

  it('should have closed the pool', () => {
    // @ts-expect-error: internal access
    assert.strictEqual(pool._closed, true);
  });
});

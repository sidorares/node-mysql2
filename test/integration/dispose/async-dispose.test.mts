import type { RowDataPacket } from '../../../index.js';
import type { PoolConnection } from '../../../promise.js';
import { assert, describe, it, skip } from 'poku';
import { createConnection, createPool } from '../../../promise.js';
import { config } from '../../common.test.mjs';

if (!('asyncDispose' in Symbol)) {
  skip('Symbol.asyncDispose is not supported in this runtime');
}

await describe('PromisePoolConnection should implement Symbol.asyncDispose', async () => {
  await using pool = createPool({ ...config, connectionLimit: 1 });
  await using conn: PoolConnection = await pool.getConnection();

  it('should be a function', () => {
    assert.strictEqual(typeof conn[Symbol.asyncDispose], 'function');
  });
});

await describe('PromiseConnection should implement Symbol.asyncDispose', async () => {
  await using conn = await createConnection(config);

  it('should be a function', () => {
    assert.strictEqual(typeof conn[Symbol.asyncDispose], 'function');
  });
});

await describe('PromisePool should implement Symbol.asyncDispose', async () => {
  await using pool = createPool({ ...config, connectionLimit: 1 });

  it('should be a function', () => {
    assert.strictEqual(typeof pool[Symbol.asyncDispose], 'function');
  });
});

await describe('await using should release the connection back to the pool', async () => {
  await using pool = createPool({ ...config, connectionLimit: 1 });

  await it('should use and dispose the connection', async () => {
    await using conn: PoolConnection = await pool.getConnection();

    const [rows] = await conn.query<RowDataPacket[]>('SELECT 1');

    assert.deepStrictEqual(rows, [{ 1: 1 }]);
  });

  it('should have returned the connection to the free pool', () => {
    // @ts-expect-error: internal access
    assert.strictEqual(pool.pool._freeConnections.length, 1);
  });
});

await describe('Pool should serve a new connection after await using releases the previous one', async () => {
  await using pool = createPool({ ...config, connectionLimit: 1 });

  await it('should use and dispose the first connection', async () => {
    await using conn: PoolConnection = await pool.getConnection();

    const [rows] = await conn.query<RowDataPacket[]>('SELECT 1');
    assert.deepStrictEqual(rows, [{ 1: 1 }]);
  });

  await it('should use and dispose the second connection', async () => {
    await using conn: PoolConnection = await pool.getConnection();

    const [rows] = await conn.query<RowDataPacket[]>('SELECT 1');
    assert.deepStrictEqual(rows, [{ 1: 1 }]);
  });

  it('should have served both connections with a single pool slot', () => {
    // @ts-expect-error: internal access
    assert.strictEqual(pool.pool._allConnections.length, 1);
  });
});

await describe('asyncDispose should end the connection', async () => {
  const conn = await createConnection(config);
  const [rows] = await conn.query<RowDataPacket[]>('SELECT 1');
  assert.deepStrictEqual(rows, [{ 1: 1 }]);
  await conn[Symbol.asyncDispose]();

  it('should have closed the connection', () => {
    // @ts-expect-error: internal access
    assert.strictEqual(conn.connection._closing, true);
  });
});

await describe('asyncDispose should end the pool', async () => {
  const pool = createPool({ ...config, connectionLimit: 1 });
  const [rows] = await pool.query<RowDataPacket[]>('SELECT 1');
  assert.deepStrictEqual(rows, [{ 1: 1 }]);
  await pool[Symbol.asyncDispose]();

  it('should have closed the pool', () => {
    // @ts-expect-error: internal access
    assert.strictEqual(pool.pool._closed, true);
  });
});

await describe('asyncDispose should handle end before asyncDispose on pool', async () => {
  const pool = createPool({ ...config, connectionLimit: 1 });
  await pool.end();
  await pool[Symbol.asyncDispose]();

  it('should have closed the pool', () => {
    // @ts-expect-error: internal access
    assert.strictEqual(pool.pool._closed, true);
  });
});

await describe('await using should handle manual `destroy` before automatic dispose on pool connection', async () => {
  await using pool = createPool({ ...config, connectionLimit: 1 });

  await it('should not error when connection is destroyed within await using', async () => {
    await using conn: PoolConnection = await pool.getConnection();

    const [rows] = await conn.query<RowDataPacket[]>('SELECT 1');
    assert.deepStrictEqual(rows, [{ 1: 1 }]);
    conn.destroy();
  });

  it('should have removed the destroyed connection from the pool', () => {
    // @ts-expect-error: internal access
    assert.strictEqual(pool.pool._allConnections.length, 0);
  });
});

await describe('force await using should handle manual `destroy` before automatic dispose on connection', async () => {
  const conn = await createConnection(config);
  const [rows] = await conn.query<RowDataPacket[]>('SELECT 1');
  assert.deepStrictEqual(rows, [{ 1: 1 }]);
  conn.destroy();
  await conn[Symbol.asyncDispose]();

  it('should have closed the connection', () => {
    // @ts-expect-error: internal access
    assert.strictEqual(conn.connection._closing, true);
  });
});

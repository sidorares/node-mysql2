import type { Pool } from '../../index.js';
import type { RowDataPacket } from '../../promise.js';
import { describe, it, strict } from 'poku';
import { createPool } from '../common.test.mjs';

const queueSizes = (pool: Pool): { all: number; free: number } => ({
  // @ts-expect-error: internal access
  all: pool._allConnections.length,
  // @ts-expect-error: internal access
  free: pool._freeConnections.length,
});

await describe('Pool removes destroyed connections from its queues', async () => {
  const pool = createPool({ connectionLimit: 3 });
  const promisePool = pool.promise();

  const first = await promisePool.getConnection();
  const second = await promisePool.getConnection();
  const third = await promisePool.getConnection();

  second.release();
  third.release();

  it('holds three connections, two of them free', () => {
    strict.deepEqual(queueSizes(pool), { all: 3, free: 2 });
  });

  first.destroy();

  it('drops a destroyed held connection from the pool', () => {
    strict.deepEqual(queueSizes(pool), { all: 2, free: 2 });
  });

  second.destroy();

  it('drops a destroyed free connection from both queues', () => {
    strict.deepEqual(queueSizes(pool), { all: 1, free: 1 });
  });

  await it('still serves queries afterwards', async () => {
    const [rows] = await promisePool.query<RowDataPacket[]>('SELECT 1 AS ok');

    strict.equal(rows[0].ok, 1);
  });

  await promisePool.end();
});

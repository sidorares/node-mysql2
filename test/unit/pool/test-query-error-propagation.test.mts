import { describe, it, strict } from 'poku';
import BasePool from '../../../lib/base/pool.js';

const createPool = () => {
  const released: string[] = [];
  const connection = {
    query() {
      throw new Error('Simulated error.');
    },
    release() {
      released.push('released');
    },
  };
  const pool = Object.create(BasePool.prototype);

  pool.config = { connectionConfig: {} };
  pool.getConnection = (cb: (err: Error | null, conn: unknown) => void) => {
    setImmediate(() => cb(null, connection));
  };

  return { pool, released };
};

await describe('pool.query() error propagation', async () => {
  await it('forwards dispatch errors to the callback', async () => {
    const { pool, released } = createPool();

    const error = await new Promise<Error>((resolve) => {
      pool.query('SELECT 1', [], resolve);
    });

    strict.strictEqual(error.message, 'Simulated error.');
    strict.deepStrictEqual(released, ['released']);
  });

  await it('emits an error event without a callback', async () => {
    const { pool, released } = createPool();

    const error = await new Promise<Error>((resolve) => {
      pool.query('SELECT 1').once('error', resolve);
    });

    strict.strictEqual(error.message, 'Simulated error.');
    strict.deepStrictEqual(released, ['released']);
  });
});

import type { PoolOptions, RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import PoolConnection from '../../../../lib/pool_connection.js';
import { createPool as createPoolPromise } from '../../../../promise.js';
import { config } from '../../common.test.mjs';

type TestRow = RowDataPacket & { ttt: number };

await describe('Regression #485', async () => {
  function createPool(args?: PoolOptions) {
    if (!args && process.env.MYSQL_CONNECTION_URL) {
      return createPoolPromise({ uri: process.env.MYSQL_CONNECTION_URL });
    }

    return createPoolPromise({ ...config, ...args });
  }

  await it('should call PoolConnection.release after pool.execute', async () => {
    const release = PoolConnection.prototype.release;
    let releaseCalls = 0;
    PoolConnection.prototype.release = function () {
      releaseCalls++;
    };

    const pool = createPool();

    try {
      const result = await pool.execute<TestRow[]>('select 1+2 as ttt');
      assert.equal(result[0][0].ttt, 3);
    } finally {
      await pool.end();
      PoolConnection.prototype.release = release;
    }

    assert.equal(releaseCalls, 1, 'PoolConnection.release was not called');
  });
});

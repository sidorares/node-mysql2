import type { PoolOptions, RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import PoolConnection from '../../../../lib/pool_connection.js';
import { createPool as createPoolPromise } from '../../../../promise.js';
import { config } from '../../common.test.mjs';

type TestRow = RowDataPacket & { ttt: number };

function createPool(args?: PoolOptions) {
  if (!args && process.env.MYSQL_CONNECTION_URL) {
    return createPoolPromise({ uri: process.env.MYSQL_CONNECTION_URL });
  }
  return createPoolPromise({ ...config, ...args });
}

// stub
const release = PoolConnection.prototype.release;
let releaseCalls = 0;
PoolConnection.prototype.release = function () {
  releaseCalls++;
};

function testPoolPromiseExecuteLeak() {
  const pool = createPool();
  pool
    .execute<TestRow[]>('select 1+2 as ttt')
    .then((result) => {
      assert.equal(result[0][0].ttt, 3);
      return pool.end();
    })
    .catch((err) => {
      assert.ifError(err);
    });
}

testPoolPromiseExecuteLeak();

process.on('exit', () => {
  PoolConnection.prototype.release = release;
  assert.equal(releaseCalls, 1, 'PoolConnection.release was not called');
});

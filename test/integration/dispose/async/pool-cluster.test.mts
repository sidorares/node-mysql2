import type { RowDataPacket } from '../../../../index.js';
import { assert, describe, it, skip } from 'poku';
import { createPoolCluster } from '../../../../promise.js';
import { config } from '../../../common.test.mjs';

if (!('asyncDispose' in Symbol)) {
  skip('Symbol.asyncDispose is not supported in this runtime');
}

await describe('PromisePoolCluster should implement Symbol.asyncDispose', async () => {
  await using cluster = createPoolCluster();

  cluster.add('MASTER', config);

  it('should be a function', () => {
    assert.strictEqual(typeof cluster[Symbol.asyncDispose], 'function');
  });
});

await describe('asyncDispose should end the pool cluster', async () => {
  await using cluster = createPoolCluster();

  cluster.add('MASTER', config);

  const [rows] = await cluster.of('*').query<RowDataPacket[]>('SELECT 1');

  await cluster[Symbol.asyncDispose]();

  it('should have received the query result', () => {
    assert.deepStrictEqual(rows, [{ 1: 1 }]);
  });

  it('should have closed the pool cluster', () => {
    // @ts-expect-error: internal access
    assert.strictEqual(cluster.poolCluster._closed, true);
  });
});

await describe('asyncDispose should handle manual end before asyncDispose on pool cluster', async () => {
  await using cluster = createPoolCluster();

  cluster.add('MASTER', config);
  await cluster.end();
  await cluster[Symbol.asyncDispose]();

  it('should have closed the pool cluster', () => {
    // @ts-expect-error: internal access
    assert.strictEqual(cluster.poolCluster._closed, true);
  });
});

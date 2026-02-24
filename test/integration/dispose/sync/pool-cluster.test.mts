import type { PoolCluster, RowDataPacket } from '../../../../index.js';
import { describe, it, skip, strict } from 'poku';
import { createPoolCluster, getConfig } from '../../../common.test.mjs';

if (!('dispose' in Symbol)) {
  skip('Symbol.dispose is not supported in this runtime');
}

const clusterQuery = (cluster: PoolCluster, sql: string) =>
  new Promise<RowDataPacket[]>((resolve, reject) => {
    cluster.of('*').query<RowDataPacket[]>(sql, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

await describe('PoolCluster should implement Symbol.dispose', async () => {
  using cluster = createPoolCluster();

  cluster.add('MASTER', getConfig());

  it('should be a function', () => {
    strict.strictEqual(typeof cluster[Symbol.dispose], 'function');
  });
});

await describe('dispose should end the pool cluster', async () => {
  using cluster = createPoolCluster();

  cluster.add('MASTER', getConfig());

  const rows = await clusterQuery(cluster, 'SELECT 1');

  cluster[Symbol.dispose]();

  it('should have received the query result', () => {
    strict.deepStrictEqual(rows, [{ 1: 1 }]);
  });

  it('should have closed the pool cluster', () => {
    // @ts-expect-error: internal access
    strict.strictEqual(cluster._closed, true);
  });
});

await describe('dispose should handle manual end before dispose on pool cluster', async () => {
  using cluster = createPoolCluster();

  cluster.add('MASTER', getConfig());

  await new Promise<void>((resolve, reject) => {
    cluster.end((err) => (err ? reject(err) : resolve()));
  });

  cluster[Symbol.dispose]();

  it('should have closed the pool cluster', () => {
    // @ts-expect-error: internal access
    strict.strictEqual(cluster._closed, true);
  });
});

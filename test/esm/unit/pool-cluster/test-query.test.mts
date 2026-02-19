import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import { createPoolCluster, getConfig } from '../../common.test.mjs';

// TODO: config poolCluster to work with MYSQL_CONNECTION_URL run
if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

await describe('pool cluster connection query', async () => {
  await it('should execute query through pool cluster', async () => {
    const cluster = createPoolCluster();
    const poolConfig = getConfig();

    cluster.add('MASTER', poolConfig);
    cluster.add('SLAVE1', poolConfig);
    cluster.add('SLAVE2', poolConfig);

    const connection = cluster.of('*');

    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>('SELECT 1', (err, _rows) =>
        err ? reject(err) : resolve(_rows)
      );
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0]['1'], 1);
    // @ts-expect-error: internal access
    assert.deepEqual(cluster._serviceableNodeIds, [
      'MASTER',
      'SLAVE1',
      'SLAVE2',
    ]);

    cluster.end();
  });
});

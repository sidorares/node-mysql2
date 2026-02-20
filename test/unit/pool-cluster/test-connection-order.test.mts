import process from 'node:process';
import { assert, describe, it, skip } from 'poku';
import { createPoolCluster, getConfig } from '../../common.test.mjs';

// TODO: config poolCluster to work with MYSQL_CONNECTION_URL run
if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('Skipping test for PlanetScale');
}

await describe('pool cluster connection ORDER', async () => {
  await it('should get connections in ORDER', async () => {
    const cluster = createPoolCluster();

    const order: string[] = [];

    const poolConfig = getConfig();
    cluster.add('SLAVE1', poolConfig);
    cluster.add('SLAVE2', poolConfig);

    const pool = cluster.of('SLAVE*', 'ORDER');

    await new Promise<void>((resolve, reject) => {
      let count = 0;

      function getConnection(i: number) {
        pool.getConnection((err, conn) => {
          if (err) return reject(err);
          // @ts-expect-error: internal access
          order[i] = conn._clusterId;
          conn.release();

          count += 1;

          if (count <= 4) {
            getConnection(count);
          } else {
            resolve();
          }
        });
      }

      getConnection(0);
    });

    assert.deepEqual(order, ['SLAVE1', 'SLAVE1', 'SLAVE1', 'SLAVE1', 'SLAVE1']);
    cluster.end();
  });
});

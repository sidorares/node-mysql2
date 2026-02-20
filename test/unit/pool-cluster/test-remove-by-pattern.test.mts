import process from 'node:process';
import { assert, describe, it, skip } from 'poku';
import mysql from '../../../index.js';
import { createPoolCluster } from '../../common.test.mjs';

// TODO: config poolCluster to work with MYSQL_CONNECTION_URL run
if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('Skipping test for PlanetScale');
}

if (process.platform === 'win32') {
  skip('Windows: test is known to fail (FIXME: investigate why)');
}

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

await describe('pool cluster remove by pattern', async () => {
  const cluster = createPoolCluster();
  // @ts-expect-error: TODO: implement typings
  const server = mysql.createServer();

  server.on('connection', (conn) => {
    conn.serverHandshake({
      serverVersion: 'node.js rocks',
    });
    conn.on('error', () => {
      // server side of the connection
      // ignore disconnects
    });
  });

  const port = await new Promise<number>((resolve) => {
    // @ts-expect-error: TODO: implement typings
    server.listen(0, () => {
      // @ts-expect-error: internal access
      resolve(server._server.address().port as number);
    });
  });

  cluster.add('SLAVE1', { port });
  cluster.add('SLAVE2', { port });

  const pool = cluster.of('SLAVE*', 'ORDER');

  await it('should remove nodes by pattern', async () => {
    const result = await new Promise<{ clusterId: string }>(
      (resolve, reject) => {
        pool.getConnection((err, conn) => {
          if (err) return reject(err);
          // @ts-expect-error: internal access
          const clusterId = conn._clusterId as string;
          conn.release();
          resolve({ clusterId });
        });
      }
    );

    assert.strictEqual(result.clusterId, 'SLAVE1');
    cluster.remove('SLAVE*');

    const err = await new Promise<(Error & { code?: string }) | null>(
      (resolve) => {
        pool.getConnection((_err) => resolve(_err));
      }
    );

    assert.ok(err);
    assert.equal(err?.code, 'POOL_NOEXIST');

    cluster.remove('SLAVE*');
    cluster.remove('SLAVE2');
  });

  await new Promise<void>((resolve, reject) => {
    cluster.end((err) => (err ? reject(err) : resolve()));
  });

  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

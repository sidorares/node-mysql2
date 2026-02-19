import process from 'node:process';
import { assert, describe, it } from 'poku';
import mysql from '../../../index.js';
import { createPoolCluster } from '../../common.test.mjs';

// TODO: config poolCluster to work with MYSQL_CONNECTION_URL run
if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

if (process.platform === 'win32') {
  console.log('This test is known to fail on windows. FIXME: investi=gate why');
  process.exit(0);
}

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

await describe('pool cluster remove by name', async () => {
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

  await it('should remove nodes by name', async () => {
    const result1 = await new Promise<{ clusterId: string }>(
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

    assert.strictEqual(result1.clusterId, 'SLAVE1');
    cluster.remove('SLAVE1');

    const result2 = await new Promise<{ clusterId: string }>(
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

    assert.strictEqual(result2.clusterId, 'SLAVE2');
    cluster.remove('SLAVE2');

    const err = await new Promise<(Error & { code?: string }) | null>(
      (resolve) => {
        pool.getConnection((_err) => resolve(_err));
      }
    );

    assert.ok(err);
    assert.equal(err?.code, 'POOL_NOEXIST');

    cluster.remove('SLAVE1');
    cluster.remove('SLAVE2');
  });

  await new Promise<void>((resolve, reject) => {
    cluster.end((err) => (err ? reject(err) : resolve()));
  });

  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

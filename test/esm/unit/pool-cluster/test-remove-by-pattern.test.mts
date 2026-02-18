import process from 'node:process';
import { assert, describe, it } from 'poku';
import mysql from '../../../../index.js';
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

await describe('pool cluster remove by pattern', async () => {
  await it('should remove nodes by pattern', async () => {
    const cluster = createPoolCluster();
    // @ts-expect-error: TODO: implement typings
    const server = mysql.createServer();

    await new Promise<void>((resolve, reject) => {
      server.on('connection', (conn) => {
        conn.serverHandshake({
          serverVersion: 'node.js rocks',
        });
        conn.on('error', () => {
          // server side of the connection
          // ignore disconnects
        });
      });

      // @ts-expect-error: TODO: implement typings
      server.listen(0, () => {
        // @ts-expect-error: internal access
        const port = server._server.address().port;
        cluster.add('SLAVE1', { port });
        cluster.add('SLAVE2', { port });

        const pool = cluster.of('SLAVE*', 'ORDER');

        pool.getConnection((err, conn) => {
          if (err) return reject(err);
          // @ts-expect-error: internal access
          assert.strictEqual(conn._clusterId, 'SLAVE1');

          conn.release();
          cluster.remove('SLAVE*');

          pool.getConnection((err) => {
            assert.ok(err);
            assert.equal(err?.code, 'POOL_NOEXIST');

            cluster.remove('SLAVE*');
            cluster.remove('SLAVE2');

            cluster.end((err) => {
              if (err) return reject(err);
              // @ts-expect-error: TODO: implement typings
              server.close();
              resolve();
            });
          });
        });
      });
    });
  });
});

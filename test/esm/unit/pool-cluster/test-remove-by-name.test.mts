import process from 'node:process';
import { assert, describe, it } from 'poku';
import portfinder from 'portfinder';
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

await describe('pool cluster remove by name', async () => {
  await it('should remove nodes by name', async () => {
    const cluster = createPoolCluster();
    // @ts-expect-error: TODO: implement typings
    const server = mysql.createServer();

    await new Promise<void>((resolve, reject) => {
      portfinder.getPort((_err, port) => {
        cluster.add('SLAVE1', { port });
        cluster.add('SLAVE2', { port });

        // @ts-expect-error: TODO: implement typings
        server.listen(port + 0, (err) => {
          if (err) return reject(err);

          const pool = cluster.of('SLAVE*', 'ORDER');

          pool.getConnection((err, conn) => {
            if (err) return reject(err);
            // @ts-expect-error: internal access
            assert.strictEqual(conn._clusterId, 'SLAVE1');

            conn.release();
            cluster.remove('SLAVE1');

            pool.getConnection((err, conn) => {
              if (err) return reject(err);
              // @ts-expect-error: internal access
              assert.strictEqual(conn._clusterId, 'SLAVE2');

              conn.release();
              cluster.remove('SLAVE2');

              pool.getConnection((err) => {
                assert.ok(err);
                assert.equal(err?.code, 'POOL_NOEXIST');

                cluster.remove('SLAVE1');
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

        server.on('connection', (conn) => {
          conn.serverHandshake({
            serverVersion: 'node.js rocks',
          });
          conn.on('error', () => {
            // server side of the connection
            // ignore disconnects
          });
        });
      });
    });
  });
});

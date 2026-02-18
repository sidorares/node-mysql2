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

await describe('pool cluster restore', async () => {
  await it('should restore node after timeout', async () => {
    const cluster = createPoolCluster({
      canRetry: true,
      removeNodeErrorCount: 2,
      restoreNodeTimeout: 100,
    });

    let connCount = 0;
    let offline = true;

    // @ts-expect-error: TODO: implement typings
    const server = mysql.createServer();

    await new Promise<void>((resolve, reject) => {
      portfinder.getPort((_err, port) => {
        cluster.add('MASTER', { port });

        // @ts-expect-error: TODO: implement typings
        server.listen(port + 0, (err) => {
          if (err) return reject(err);

          cluster.getConnection('MASTER', (err) => {
            assert.ok(err);
            assert.equal(err?.code, 'PROTOCOL_CONNECTION_LOST');
            // @ts-expect-error: TODO: implement typings
            assert.equal(err?.fatal, true);
            assert.equal(connCount, 2);

            cluster.getConnection('MASTER', (err) => {
              assert.ok(err);
              assert.equal(err?.code, 'POOL_NONEONLINE');

              // @ts-expect-error: internal access
              cluster._nodes.MASTER.errorCount = 3;

              offline = false;
            });

            setTimeout(() => {
              cluster.getConnection('MASTER', (err, conn) => {
                if (err) return reject(err);
                conn.release();

                cluster.end((err) => {
                  if (err) return reject(err);
                  // @ts-expect-error: TODO: implement typings
                  server.close();
                  resolve();
                });
              });
            }, 200);
          });
        });

        server.on('connection', (conn) => {
          connCount += 1;

          if (offline) {
            conn.close();
          } else {
            conn.serverHandshake({
              serverVersion: 'node.js rocks',
            });
            conn.on('error', () => {
              // server side of the connection
              // ignore disconnects
            });
          }
        });
      });
    });
  });
});

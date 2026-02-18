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

await describe('pool cluster restore events', async () => {
  await it('should emit offline and online events', async () => {
    const cluster = createPoolCluster({
      canRetry: true,
      removeNodeErrorCount: 2,
      restoreNodeTimeout: 100,
    });

    let connCount = 0;
    let offline = true;
    let offlineEvents = 0;
    let onlineEvents = 0;

    // @ts-expect-error: TODO: implement typings
    const server = mysql.createServer();

    await new Promise<void>((resolve, reject) => {
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

      // @ts-expect-error: TODO: implement typings
      server.listen(0, () => {
        // @ts-expect-error: internal access
        const port = server._server.address().port;
        cluster.add('MASTER', { port });

        cluster.on('offline', (id) => {
          assert.equal(++offlineEvents, 1);
          assert.equal(id, 'MASTER');
          assert.equal(connCount, 2);

          cluster.getConnection('MASTER', (err) => {
            assert.ok(err);
            assert.equal(err?.code, 'POOL_NONEONLINE');

            offline = false;
          });

          setTimeout(() => {
            cluster.getConnection('MASTER', (err, conn) => {
              if (err) return reject(err);
              conn.release();
            });
          }, 200);
        });

        cluster.on('online', (id) => {
          assert.equal(++onlineEvents, 1);
          assert.equal(id, 'MASTER');
          assert.equal(connCount, 3);

          cluster.end((err) => {
            if (err) return reject(err);
            // @ts-expect-error: TODO: implement typings
            server.close();
            resolve();
          });
        });

        cluster.getConnection('MASTER', (err) => {
          assert.ok(err);
          assert.equal(err?.code, 'PROTOCOL_CONNECTION_LOST');
          // @ts-expect-error: TODO: implement typings
          assert.equal(err?.fatal, true);
          assert.equal(connCount, 2);
        });
      });
    });
  });
});

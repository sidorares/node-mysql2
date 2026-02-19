import process from 'node:process';
import { assert, describe, it, sleep } from 'poku';
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

await describe('pool cluster restore', async () => {
  const cluster = createPoolCluster({
    canRetry: true,
    removeNodeErrorCount: 2,
    restoreNodeTimeout: 1000,
  });

  let connCount = 0;
  let offline = true;

  // @ts-expect-error: TODO: implement typings
  const server = mysql.createServer();

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

  const port = await new Promise<number>((resolve) => {
    // @ts-expect-error: TODO: implement typings
    server.listen(0, () => {
      // @ts-expect-error: internal access
      resolve(server._server.address().port as number);
    });
  });

  cluster.add('MASTER', { port });

  await it('should restore node after timeout', async () => {
    type MysqlError = Error & { code?: string; fatal?: boolean };

    // First attempt - expected to fail (offline)
    const err1 = await new Promise<MysqlError | null>((resolve) => {
      cluster.getConnection('MASTER', (err) => resolve(err));
    });

    assert.ok(err1);
    assert.equal(err1?.code, 'PROTOCOL_CONNECTION_LOST');
    assert.equal(err1?.fatal, true);
    assert.equal(connCount, 2);

    // Second attempt - expected to fail (node removed)
    const err2 = await new Promise<MysqlError | null>((resolve) => {
      cluster.getConnection('MASTER', (err) => resolve(err));
    });

    assert.ok(err2);
    assert.equal(err2?.code, 'POOL_NONEONLINE');

    // @ts-expect-error: internal access
    cluster._nodes.MASTER.errorCount = 3;
    offline = false;

    // Wait for restore timeout
    await sleep(1500);

    // Third attempt - should succeed
    await new Promise<void>((resolve, reject) => {
      cluster.getConnection('MASTER', (err, conn) => {
        if (err) return reject(err);
        conn.release();
        resolve();
      });
    });
  });

  await new Promise<void>((resolve, reject) => {
    cluster.end((err) => (err ? reject(err) : resolve()));
  });

  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

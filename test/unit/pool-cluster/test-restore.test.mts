import process from 'node:process';
import { describe, it, skip, sleep, strict } from 'poku';
import mysql from '../../../index.js';
import { createPoolCluster } from '../../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('Skipping test for PlanetScale');
}

if (process.platform === 'win32') {
  skip('Windows: test is known to fail (FIXME: investigate why)');
}

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

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

    strict.ok(err1);
    strict.equal(err1?.code, 'PROTOCOL_CONNECTION_LOST');
    strict.equal(err1?.fatal, true);
    strict.equal(connCount, 2);

    // Second attempt - expected to fail (node removed)
    const err2 = await new Promise<MysqlError | null>((resolve) => {
      cluster.getConnection('MASTER', (err) => resolve(err));
    });

    strict.ok(err2);
    strict.equal(err2?.code, 'POOL_NONEONLINE');

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

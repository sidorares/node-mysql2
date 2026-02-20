import process from 'node:process';
import { assert, describe, it, skip } from 'poku';
import mysql from '../../../index.js';
import { createPoolCluster } from '../../common.test.mjs';

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('Skipping test for PlanetScale');
}

if (process.platform === 'win32') {
  skip('Windows: test is known to fail (FIXME: investigate why)');
}

await describe('pool cluster retry', async () => {
  const cluster = createPoolCluster({
    canRetry: true,
    removeNodeErrorCount: 5,
  });

  let connCount = 0;

  // @ts-expect-error: TODO: implement typings
  const server = mysql.createServer();

  server.on('connection', (conn) => {
    connCount += 1;

    if (connCount < 2) {
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

  const port = await new Promise<number>((resolve, reject) => {
    // @ts-expect-error: TODO: implement typings
    server.listen(0, (err?: Error) => {
      if (err) return reject(err);
      // @ts-expect-error: internal access
      resolve(server._server.address().port as number);
    });
  });

  cluster.add('MASTER', { port });

  await it('should retry connection on failure', async () => {
    const result = await new Promise<{ clusterId: string }>(
      (resolve, reject) => {
        cluster.getConnection('MASTER', (err, connection) => {
          if (err) return reject(err);
          // @ts-expect-error: internal access
          const clusterId = connection._clusterId as string;
          connection.release();
          resolve({ clusterId });
        });
      }
    );

    assert.equal(connCount, 2);
    assert.equal(result.clusterId, 'MASTER');
  });

  await new Promise<void>((resolve, reject) => {
    cluster.end((err) => (err ? reject(err) : resolve()));
  });

  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

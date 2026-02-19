import process, { exit } from 'node:process';
import { assert, describe, it } from 'poku';
import mysql from '../../../index.js';
import { createPoolCluster } from '../../common.test.mjs';

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

// TODO: config poolCluster to work with MYSQL_CONNECTION_URL run
if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

if (process.platform === 'win32') {
  console.log('This test is known to fail on windows. FIXME: investi=gate why');
  exit(0);
}

await describe('pool cluster error remove', async () => {
  const cluster = createPoolCluster({
    removeNodeErrorCount: 1,
  });

  let connCount = 0;

  // @ts-expect-error: TODO: implement typings
  const server1 = mysql.createServer();
  // @ts-expect-error: TODO: implement typings
  const server2 = mysql.createServer();

  server1.on('connection', (conn) => {
    connCount += 1;
    conn.close();
  });

  server2.on('connection', (conn) => {
    connCount += 1;
    conn.serverHandshake({
      serverVersion: 'node.js rocks',
    });
  });

  const port1 = await new Promise<number>((resolve, reject) => {
    // @ts-expect-error: TODO: implement typings
    server1.listen(0, (err?: Error) => {
      if (err) return reject(err);
      // @ts-expect-error: internal access
      resolve(server1._server.address().port as number);
    });
  });

  const port2 = await new Promise<number>((resolve, reject) => {
    // @ts-expect-error: TODO: implement typings
    server2.listen(0, (err?: Error) => {
      if (err) return reject(err);
      // @ts-expect-error: internal access
      resolve(server2._server.address().port as number);
    });
  });

  cluster.add('SLAVE1', { port: port1 });
  cluster.add('SLAVE2', { port: port2 });

  const pool = cluster.of('*', 'ORDER');
  let removedNodeId: string | number;

  cluster.on('remove', (nodeId) => {
    removedNodeId = nodeId;
  });

  await it('should remove node on connection error', async () => {
    const result = await new Promise<{ clusterId: string }>(
      (resolve, reject) => {
        pool.getConnection((err, connection) => {
          if (err) return reject(err);
          // @ts-expect-error: internal access
          const clusterId = connection._clusterId as string;
          connection.release();
          resolve({ clusterId });
        });
      }
    );

    assert.equal(connCount, 2);
    assert.equal(result.clusterId, 'SLAVE2');
    assert.equal(removedNodeId, 'SLAVE1');
    // @ts-expect-error: internal access
    assert.deepEqual(cluster._serviceableNodeIds, ['SLAVE2']);
  });

  await new Promise<void>((resolve, reject) => {
    cluster.end((err) => (err ? reject(err) : resolve()));
  });
  exit();
});

import process, { exit } from 'node:process';
import { assert } from 'poku';
import portfinder from 'portfinder';
import mysql from '../../../../index.js';
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

const cluster = createPoolCluster({
  removeNodeErrorCount: 1,
});

let connCount = 0;

// @ts-expect-error: TODO: implement typings
const server1 = mysql.createServer();
// @ts-expect-error: TODO: implement typings
const server2 = mysql.createServer();

console.log('test pool cluster error remove');

portfinder.getPort((_err, port) => {
  cluster.add('SLAVE1', { port: port + 0 });
  cluster.add('SLAVE2', { port: port + 1 });

  // @ts-expect-error: TODO: implement typings
  server1.listen(port + 0, (err) => {
    assert.ifError(err);

    // @ts-expect-error: TODO: implement typings
    server2.listen(port + 1, (err) => {
      assert.ifError(err);

      const pool = cluster.of('*', 'ORDER');
      let removedNodeId: string | number;

      cluster.on('remove', (nodeId) => {
        removedNodeId = nodeId;
      });

      pool.getConnection((err, connection) => {
        assert.ifError(err);

        assert.equal(connCount, 2);
        // @ts-expect-error: internal access
        assert.equal(connection._clusterId, 'SLAVE2');
        assert.equal(removedNodeId, 'SLAVE1');
        // @ts-expect-error: internal access
        assert.deepEqual(cluster._serviceableNodeIds, ['SLAVE2']);
        console.log('done');

        connection.release();

        cluster.end((err) => {
          assert.ifError(err);
          // throw error if no exit()
          exit();
          // server1.close();
          // server2.close();
        });
      });
    });
  });

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
});

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
  canRetry: true,
  removeNodeErrorCount: 5,
});

let connCount = 0;

// @ts-expect-error: TODO: implement typings
const server = mysql.createServer();

console.log('test pool cluster retry');

portfinder.getPort((_err, port) => {
  cluster.add('MASTER', { port });

  // @ts-expect-error: TODO: implement typings
  server.listen(port + 0, (err) => {
    assert.ifError(err);

    cluster.getConnection('MASTER', (err, connection) => {
      assert.ifError(err);
      assert.equal(connCount, 2);
      // @ts-expect-error: internal access
      assert.equal(connection._clusterId, 'MASTER');

      connection.release();

      cluster.end((err) => {
        assert.ifError(err);
        // @ts-expect-error: TODO: implement typings
        server.close();
      });
    });
  });

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
});

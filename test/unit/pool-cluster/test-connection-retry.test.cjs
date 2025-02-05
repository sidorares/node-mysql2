'use strict';

const { assert } = require('poku');
const portfinder = require('portfinder');
const common = require('../../common.test.cjs');
const mysql = require('../../../index.js');
const { exit } = require('node:process');
const process = require('node:process');

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

const cluster = common.createPoolCluster({
  canRetry: true,
  removeNodeErrorCount: 5,
});

let connCount = 0;

const server = mysql.createServer();

console.log('test pool cluster retry');

portfinder.getPort((err, port) => {
  cluster.add('MASTER', { port });

  server.listen(port + 0, (err) => {
    assert.ifError(err);

    cluster.getConnection('MASTER', (err, connection) => {
      assert.ifError(err);
      assert.equal(connCount, 2);
      assert.equal(connection._clusterId, 'MASTER');

      connection.release();

      cluster.end((err) => {
        assert.ifError(err);
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

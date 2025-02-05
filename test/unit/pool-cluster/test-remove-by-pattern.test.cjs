'use strict';

const { assert } = require('poku');
const portfinder = require('portfinder');
const common = require('../../common.test.cjs');
const mysql = require('../../../index.js');
const process = require('node:process');

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

const cluster = common.createPoolCluster();
const server = mysql.createServer();

console.log('test pool cluster remove by pattern');

portfinder.getPort((err, port) => {
  cluster.add('SLAVE1', { port });
  cluster.add('SLAVE2', { port });

  server.listen(port + 0, (err) => {
    assert.ifError(err);

    const pool = cluster.of('SLAVE*', 'ORDER');

    pool.getConnection((err, conn) => {
      assert.ifError(err);
      assert.strictEqual(conn._clusterId, 'SLAVE1');

      conn.release();
      cluster.remove('SLAVE*');

      pool.getConnection((err) => {
        assert.ok(err);
        assert.equal(err.code, 'POOL_NOEXIST');

        cluster.remove('SLAVE*');
        cluster.remove('SLAVE2');

        cluster.end((err) => {
          assert.ifError(err);
          server.close();
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

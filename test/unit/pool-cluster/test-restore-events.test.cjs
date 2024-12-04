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

const cluster = common.createPoolCluster({
  canRetry: true,
  removeNodeErrorCount: 2,
  restoreNodeTimeout: 100,
});

let connCount = 0;
let offline = true;
let offlineEvents = 0;
let onlineEvents = 0;

const server = mysql.createServer();

console.log('test pool cluster restore events');

portfinder.getPort((err, port) => {
  cluster.add('MASTER', { port });

  server.listen(port + 0, (err) => {
    assert.ifError(err);

    cluster.on('offline', (id) => {
      assert.equal(++offlineEvents, 1);
      assert.equal(id, 'MASTER');
      assert.equal(connCount, 2);

      cluster.getConnection('MASTER', (err) => {
        assert.ok(err);
        assert.equal(err.code, 'POOL_NONEONLINE');

        offline = false;
      });

      setTimeout(() => {
        cluster.getConnection('MASTER', (err, conn) => {
          assert.ifError(err);
          conn.release();
        });
      }, 200);
    });

    cluster.on('online', (id) => {
      assert.equal(++onlineEvents, 1);
      assert.equal(id, 'MASTER');
      assert.equal(connCount, 3);

      cluster.end((err) => {
        assert.ifError(err);
        server.close();
      });
    });

    cluster.getConnection('MASTER', (err) => {
      assert.ok(err);
      assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
      assert.equal(err.fatal, true);
      assert.equal(connCount, 2);
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

'use strict';

if (process.platform === 'win32') {
  console.log('This test is known to fail on windows. FIXME: investi=gate why');
  process.exit(0);
}

const assert  = require('assert');
const portfinder = require('portfinder');
const common  = require('../../common');
const mysql = require('../../../index.js');
const cluster = common.createPoolCluster({
  canRetry             : true,
  removeNodeErrorCount : 1,
  restoreNodeTimeout   : 100
});

let connCount = 0;

const server = mysql.createServer();

console.log('test pool cluster restore');

portfinder.getPort((err,port) => {
  cluster.add('MASTER', { port });

  server.listen(port + 0, err => {
    assert.ifError(err);
  
    const pool = cluster.of('*', 'ORDER');
    let removedNodeId;

    cluster.on('remove', nodeId => {
      removedNodeId = nodeId;
    });

    pool.getConnection(err => {
      assert.ok(err);
      console.log(connCount, cluster._serviceableNodeIds, removedNodeId)
    });

    setTimeout(() => {
      pool.getConnection(() => {
        // TODO: restoreNodeTimeout is not supported now
        console.log(connCount, cluster._serviceableNodeIds, removedNodeId)

        cluster.end(err => {
          assert.ifError(err);
          server._server.close();
        });
      });
    }, 200)
  });
  
  server.on('connection', conn => {
    connCount += 1;
    console.log(connCount);
    if(connCount < 2) {
      conn.close();
    } else {
      conn.serverHandshake({
        serverVersion: 'node.js rocks',
      });
    }
  });
});

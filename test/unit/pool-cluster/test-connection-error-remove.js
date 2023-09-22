'use strict';

// TODO: config poolCluster to work with MYSQL_CONNECTION_URL run
if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

const assert  = require('assert');
const portfinder = require('portfinder');

const common  = require('../../common');
const mysql = require('../../../index.js');
const { exit } = require('process');

if (process.platform === 'win32') {
  console.log('This test is known to fail on windows. FIXME: investi=gate why');
  exit(0);
}

const cluster = common.createPoolCluster({
  removeNodeErrorCount : 1
});

let connCount = 0;

const server1   = mysql.createServer();
const server2   = mysql.createServer();

console.log('test pool cluster error remove');

portfinder.getPort((err,port) => {

  cluster.add('SLAVE1', {port: port + 0});
  cluster.add('SLAVE2', {port: port + 1});

  server1.listen(port + 0, err => {
    assert.ifError(err);
  
    server2.listen(port + 1, err => {
      assert.ifError(err);
  
      const pool = cluster.of('*', 'ORDER');
      let removedNodeId;
  
      cluster.on('remove', nodeId => {
        removedNodeId = nodeId;
      });
  
      pool.getConnection((err, connection) => {
        assert.ifError(err);

        assert.equal(connCount, 2);
        assert.equal(connection._clusterId, 'SLAVE2');
        assert.equal(removedNodeId, 'SLAVE1');
        assert.deepEqual(cluster._serviceableNodeIds, [ 'SLAVE2' ]);
        console.log('done')

        connection.release();

        cluster.end(err => {
          assert.ifError(err);
          // throw error if no exit() 
          exit();
          // server1.close();
          // server2.close();
        });
      });
    });
  });
  
  server1.on('connection', conn => {
    connCount += 1;
    conn.close();
  });
  
  server2.on('connection', conn => {
    connCount += 1;
    conn.serverHandshake({
      serverVersion: 'node.js rocks',
    });
  });
});

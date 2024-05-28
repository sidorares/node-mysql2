'use strict';

const { assert } = require('poku');
const common = require('../../common.test.cjs');
const process = require('node:process');

// TODO: config poolCluster to work with MYSQL_CONNECTION_URL run
if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

const cluster = common.createPoolCluster();

const order = [];

const poolConfig = common.getConfig();
cluster.add('SLAVE1', poolConfig);
cluster.add('SLAVE2', poolConfig);

const done = function () {
  assert.deepEqual(order, ['SLAVE1', 'SLAVE2', 'SLAVE1', 'SLAVE2', 'SLAVE1']);
  cluster.end();
  console.log('done');
};

const pool = cluster.of('SLAVE*', 'RR');

console.log('test pool cluster connection RR');

let count = 0;

function getConnection(i) {
  pool.getConnection((err, conn) => {
    assert.ifError(err);
    order[i] = conn._clusterId;
    conn.release();

    count += 1;

    if (count <= 4) {
      getConnection(count);
    } else {
      done();
    }
  });
}

getConnection(0);

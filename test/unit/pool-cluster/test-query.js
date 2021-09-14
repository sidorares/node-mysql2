'use strict';

const assert  = require('assert');
const common  = require('../../common');
const cluster = common.createPoolCluster();
const poolConfig = common.getConfig();


cluster.add('MASTER', poolConfig);
cluster.add('SLAVE1', poolConfig);
cluster.add('SLAVE2', poolConfig);

const connection = cluster.of('*');

console.log('test pool cluster connection query');

connection.query('SELECT 1', (err, rows) => {
  assert.ifError(err);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]['1'], 1);
  assert.deepEqual(cluster._serviceableNodeIds, [ 'MASTER', 'SLAVE1', 'SLAVE2' ])

  cluster.end();
  console.log('done');
});

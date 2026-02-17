import process from 'node:process';
import { assert } from 'poku';
import { createPoolCluster, getConfig } from '../../common.test.mjs';

// TODO: config poolCluster to work with MYSQL_CONNECTION_URL run
if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

const cluster = createPoolCluster();

const order: string[] = [];

const poolConfig = getConfig();
cluster.add('SLAVE1', poolConfig);
cluster.add('SLAVE2', poolConfig);

const done = function () {
  assert.deepEqual(order, ['SLAVE1', 'SLAVE1', 'SLAVE1', 'SLAVE1', 'SLAVE1']);
  cluster.end();
  console.log('done');
};

const pool = cluster.of('SLAVE*', 'ORDER');

console.log('test pool cluster connection ORDER');

let count = 0;

function getConnection(i: number) {
  pool.getConnection((err, conn) => {
    assert.ifError(err);
    // @ts-expect-error: internal access
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

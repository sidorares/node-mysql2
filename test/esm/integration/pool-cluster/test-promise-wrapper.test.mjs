import { test, assert, describe } from 'poku';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const common = require('../../../common.test.cjs');
const { createPoolCluster } = require('../../../../promise.js');

(async () => {
  describe('Test pool cluster', common.describeOptions);

  await test(async () => {
    const poolCluster = createPoolCluster();

    poolCluster.once('warn', async function () {
      await new Promise((resolve) => {
        assert.equal(
          // eslint-disable-next-line no-invalid-this
          this,
          poolCluster,
          'should propagate warn event to promise wrapper',
        );
        resolve(true);
      });
    });

    poolCluster.poolCluster.emit('warn', new Error());
  });

  await test(async () => {
    const poolCluster = createPoolCluster();

    poolCluster.once('remove', async function () {
      await new Promise((resolve) => {
        assert.equal(
          // eslint-disable-next-line no-invalid-this
          this,
          poolCluster,
          'should propagate remove event to promise wrapper',
        );
        resolve(true);
      });
    });

    poolCluster.poolCluster.emit('remove');
  });

  await test(async () => {
    const poolCluster = createPoolCluster();

    poolCluster.once('offline', async function () {
      await new Promise((resolve) => {
        assert.equal(
          // eslint-disable-next-line no-invalid-this
          this,
          poolCluster,
          'should propagate offline event to promise wrapper',
        );
        resolve(true);
      });
    });

    poolCluster.poolCluster.emit('offline');
  });

  await test(async () => {
    const poolCluster = createPoolCluster();

    poolCluster.once('online', async function () {
      await new Promise((resolve) => {
        assert.equal(
          // eslint-disable-next-line no-invalid-this
          this,
          poolCluster,
          'should propagate online event to promise wrapper',
        );
        resolve(true);
      });
    });

    poolCluster.poolCluster.emit('online');
  });

  await test(async () => {
    const poolCluster = createPoolCluster();
    poolCluster.add('MASTER', common.config);

    const poolNamespace = poolCluster.of('MASTER');

    const connection = await poolNamespace.getConnection();

    assert.ok(connection, 'should get connection');
    connection.release();

    const result = await poolNamespace.query(
      'SELECT 1 as a from dual where 1 = ?',
      [1],
    );
    assert.equal(result[0]['a'], 1, 'should query successfully');

    const result2 = await poolNamespace.execute(
      'SELECT 1 as a from dual where 1 = ?',
      [1],
    );
    assert.equal(result2[0]['a'], 1, 'should execute successfully');
  });
})();

import { it, assert, describe } from 'poku';
import { config, promiseDriver } from '../../common.test.mjs';

const { createPoolCluster } = promiseDriver;

await describe('Test pool cluster', async () => {
  await it(async () => {
    const poolCluster = createPoolCluster();

    poolCluster.once('warn', async function () {
      await new Promise((resolve) => {
        assert.equal(
          // eslint-disable-next-line no-invalid-this
          this,
          poolCluster,
          'should propagate warn event to promise wrapper'
        );
        resolve(true);
      });
    });

    poolCluster.poolCluster.emit('warn', new Error());
  });

  await it(async () => {
    const poolCluster = createPoolCluster();

    poolCluster.once('remove', async function () {
      await new Promise((resolve) => {
        assert.equal(
          // eslint-disable-next-line no-invalid-this
          this,
          poolCluster,
          'should propagate remove event to promise wrapper'
        );
        resolve(true);
      });
    });

    poolCluster.poolCluster.emit('remove');
  });

  await it(async () => {
    const poolCluster = createPoolCluster();

    poolCluster.once('offline', async function () {
      await new Promise((resolve) => {
        assert.equal(
          // eslint-disable-next-line no-invalid-this
          this,
          poolCluster,
          'should propagate offline event to promise wrapper'
        );
        resolve(true);
      });
    });

    poolCluster.poolCluster.emit('offline');
  });

  await it(async () => {
    const poolCluster = createPoolCluster();

    poolCluster.once('online', async function () {
      await new Promise((resolve) => {
        assert.equal(
          // eslint-disable-next-line no-invalid-this
          this,
          poolCluster,
          'should propagate online event to promise wrapper'
        );
        resolve(true);
      });
    });

    poolCluster.poolCluster.emit('online');
  });

  await it(async () => {
    const poolCluster = createPoolCluster();
    poolCluster.add('MASTER', config);

    const poolNamespace = poolCluster.of('MASTER');

    assert.equal(
      poolNamespace.poolNamespace,
      poolCluster.poolCluster.of('MASTER')
    );

    const connection = await poolNamespace.getConnection();

    assert.ok(connection, 'should get connection');
    connection.release();

    const [result] = await poolNamespace.query(
      'SELECT 1 as a from dual where 1 = ?',
      [1]
    );
    assert.equal(result[0]['a'], 1, 'should query successfully');

    const [result2] = await poolNamespace.execute(
      'SELECT 1 as a from dual where 1 = ?',
      [1]
    );
    assert.equal(result2[0]['a'], 1, 'should execute successfully');

    poolCluster.end();
  });

  await it(async () => {
    const poolCluster = createPoolCluster();
    poolCluster.add('SLAVE', config);

    try {
      await poolCluster.getConnection('SLAVE1');
      assert.fail('An error was expected');
    } catch (error) {
      assert.equal(
        error.code,
        'POOL_NOEXIST',
        'should throw when PoolNamespace does not exist'
      );
    } finally {
      poolCluster.end();
    }
  });

  await it(async () => {
    const poolCluster = createPoolCluster();
    poolCluster.add('SLAVE1', config);

    try {
      const connection = await poolCluster.getConnection(/SLAVE[12]/);
      assert.equal(
        connection.connection._clusterId,
        'SLAVE1',
        'should match regex pattern'
      );
    } catch {
      assert.fail('should not throw');
    } finally {
      poolCluster.end();
    }
  });
});

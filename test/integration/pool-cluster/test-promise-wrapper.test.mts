import type { QueryError, RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import promiseDriver from '../../../promise.js';
import { config } from '../../common.test.mjs';

type TestRow = RowDataPacket & { a: number };

const { createPoolCluster } = promiseDriver;

await describe('Pool cluster: warn event', async () => {
  await it(async () => {
    const poolCluster = createPoolCluster();

    poolCluster.once('warn', async function () {
      await new Promise((resolve) => {
        strict.equal(
          // eslint-disable-next-line no-invalid-this
          this,
          poolCluster,
          'should propagate warn event to promise wrapper'
        );
        resolve(true);
      });
    });

    // @ts-expect-error: TODO: implement typings
    poolCluster.poolCluster.emit('warn', new Error());
  });
});

await describe('Pool cluster: remove event', async () => {
  await it(async () => {
    const poolCluster = createPoolCluster();

    poolCluster.once('remove', async function () {
      await new Promise((resolve) => {
        strict.equal(
          // eslint-disable-next-line no-invalid-this
          this,
          poolCluster,
          'should propagate remove event to promise wrapper'
        );
        resolve(true);
      });
    });

    // @ts-expect-error: TODO: implement typings
    poolCluster.poolCluster.emit('remove');
  });
});

await describe('Pool cluster: offline event', async () => {
  await it(async () => {
    const poolCluster = createPoolCluster();

    poolCluster.once('offline', async function () {
      await new Promise((resolve) => {
        strict.equal(
          // eslint-disable-next-line no-invalid-this
          this,
          poolCluster,
          'should propagate offline event to promise wrapper'
        );
        resolve(true);
      });
    });

    // @ts-expect-error: TODO: implement typings
    poolCluster.poolCluster.emit('offline');
  });
});

await describe('Pool cluster: online event', async () => {
  await it(async () => {
    const poolCluster = createPoolCluster();

    poolCluster.once('online', async function () {
      await new Promise((resolve) => {
        strict.equal(
          // eslint-disable-next-line no-invalid-this
          this,
          poolCluster,
          'should propagate online event to promise wrapper'
        );
        resolve(true);
      });
    });

    // @ts-expect-error: TODO: implement typings
    poolCluster.poolCluster.emit('online');
  });
});

await describe('Pool cluster: namespace query and execute', async () => {
  const poolCluster = createPoolCluster();
  poolCluster.add('MASTER', config);

  await it(async () => {
    const poolNamespace = poolCluster.of('MASTER');

    strict.equal(
      // @ts-expect-error: TODO: implement typings
      poolNamespace.poolNamespace,
      // @ts-expect-error: TODO: implement typings
      poolCluster.poolCluster.of('MASTER')
    );

    const connection = await poolNamespace.getConnection();

    strict.ok(connection, 'should get connection');
    connection.release();

    const [result] = await poolNamespace.query<TestRow[]>(
      'SELECT 1 as a from dual where 1 = ?',
      [1]
    );
    strict.equal(result[0]['a'], 1, 'should query successfully');

    const [result2] = await poolNamespace.execute<TestRow[]>(
      'SELECT 1 as a from dual where 1 = ?',
      [1]
    );
    strict.equal(result2[0]['a'], 1, 'should execute successfully');
  });

  poolCluster.end();
});

await describe('Pool cluster: POOL_NOEXIST error', async () => {
  const poolCluster = createPoolCluster();
  poolCluster.add('SLAVE', config);

  await it(async () => {
    let threw = false;
    let errorCode: string | undefined;

    try {
      await poolCluster.getConnection('SLAVE1');
    } catch (error: unknown) {
      threw = true;
      errorCode = (error as QueryError).code;
    }

    strict(threw, 'An error was expected');
    strict.equal(
      errorCode,
      'POOL_NOEXIST',
      'should throw when PoolNamespace does not exist'
    );
  });

  poolCluster.end();
});

await describe('Pool cluster: regex pattern matching', async () => {
  const poolCluster = createPoolCluster();
  poolCluster.add('SLAVE1', config);

  await it(async () => {
    // @ts-expect-error: TODO: implement typings
    const connection = await poolCluster.getConnection(/SLAVE[12]/);
    strict.equal(
      // @ts-expect-error: TODO: implement typings
      connection.connection._clusterId,
      'SLAVE1',
      'should match regex pattern'
    );
  });

  poolCluster.end();
});

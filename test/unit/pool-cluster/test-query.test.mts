import type { RowDataPacket } from '../../../index.js';
import { once } from 'node:events';
import process from 'node:process';
import { promisify } from 'node:util';
import { describe, it, skip, strict } from 'poku';
import { createPoolCluster as createPromisePoolCluster } from '../../../promise.js';
import { createPoolCluster, getConfig } from '../../common.test.mjs';

// TODO: config poolCluster to work with MYSQL_CONNECTION_URL run
if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('Skipping test for PlanetScale');
}

await describe('pool cluster connection query', async () => {
  await it('should execute query through pool cluster', async () => {
    const cluster = createPoolCluster();
    const poolConfig = getConfig();

    cluster.add('MASTER', poolConfig);
    cluster.add('SLAVE1', poolConfig);
    cluster.add('SLAVE2', poolConfig);

    const connection = cluster.of('*');

    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>('SELECT 1', (err, _rows) =>
        err ? reject(err) : resolve(_rows)
      );
    });

    strict.equal(rows.length, 1);
    strict.equal(rows[0]['1'], 1);
    // @ts-expect-error: internal access
    strict.deepEqual(cluster._serviceableNodeIds, [
      'MASTER',
      'SLAVE1',
      'SLAVE2',
    ]);

    cluster.end();
  });
});

const config = {
  ...getConfig(),
  connectionLimit: 1,
  waitForConnections: false,
  noBackslashEscapes: true,
};
const sqlWithAmbiguousQuote = "SELECT 'it\\'s' AS text, ? AS value";

await describe('pool cluster formatting errors in the Promise API', async () => {
  const cluster = createPromisePoolCluster();
  cluster.add('MASTER', config);
  const namespace = cluster.of('MASTER');

  await it('should reject the query and release its connection', async () => {
    await strict.rejects(
      namespace.query(sqlWithAmbiguousQuote, ['sample']),
      TypeError
    );

    const [rows] = await namespace.query<RowDataPacket[]>('SELECT 1 AS value');
    strict.equal(rows[0].value, 1);
  });

  await cluster.end();
});

await describe('pool cluster formatting errors in the callback API', async () => {
  const cluster = createPoolCluster();
  cluster.add('MASTER', config);
  const namespace = cluster.of('MASTER');

  await it('should pass the error to the query callback', async () => {
    const error = await new Promise<Error | null>((resolve) => {
      namespace.query(sqlWithAmbiguousQuote, ['sample'], (err) => resolve(err));
    });

    strict.ok(error instanceof TypeError);
  });

  await it('should emit the error on the query when no callback was provided', async () => {
    const query = namespace.query(sqlWithAmbiguousQuote, ['sample']);
    const [error]: unknown[] = await once(query, 'error');

    strict.ok(error instanceof TypeError);
  });

  await promisify(cluster.end).call(cluster);
});

import type { QueryError } from '../../../index.js';
import process from 'node:process';
import { skip, strict, test } from 'poku';
import { createConnection, getMysqlVersion } from '../../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('Skipping test for PlanetScale');
}

await test('query stream errors when the connection is lost mid-stream', async () => {
  const connection = createConnection({
    multipleStatements: true,
  });
  // the connection itself still reports the error
  connection.on('error', () => {});

  const mySqlVersion = await getMysqlVersion(connection);
  if (mySqlVersion.major < 8) {
    skip('MySQL >= 8.0 required to use CTE');
  }

  // MariaDB names the CTE depth limit max_recursive_iterations
  const recursionVariable = mySqlVersion.isMariaDB
    ? 'max_recursive_iterations'
    : 'cte_max_recursion_depth';

  // big and hard to compress enough to fill the socket buffers, so the server
  // blocks writing while the stream is paused and drops the connection after
  // net_write_timeout
  const largeQuery = `
    SET SESSION ${recursionVariable} = 100000, net_write_timeout = 1;
    WITH RECURSIVE cte (n) AS (
      SELECT 1
      UNION ALL
      SELECT n + 1
      FROM cte
      WHERE n < 100000
    )
    SELECT n, CONCAT(SHA2(n, 512), SHA2(-n, 512), SHA2(n * 3, 512), SHA2(n * 7, 512)) AS s
    FROM cte;
  `;

  const stream = connection.query(largeQuery).stream();

  const error = await new Promise<QueryError | null>((resolve) => {
    const timeout = setTimeout(() => resolve(null), 15000);
    let paused = false;
    stream.on('data', () => {
      if (paused) return;
      paused = true;
      stream.pause();
      setTimeout(() => stream.resume(), 3000);
    });
    stream.on('error', (err: QueryError) => {
      clearTimeout(timeout);
      resolve(err);
    });
    stream.on('end', () => {
      clearTimeout(timeout);
      resolve(null);
    });
  });

  // @ts-expect-error: TODO: implement typings
  connection.close();

  strict.ok(error, 'stream should error instead of hanging or ending');
});

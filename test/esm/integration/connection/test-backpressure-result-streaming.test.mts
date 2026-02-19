import type { RowDataPacket } from '../../../../index.js';
import { assert, skip, sleep, test } from 'poku';
import { createConnection, getMysqlVersion } from '../../common.test.mjs';

await test('result event backpressure with pause/resume', async () => {
  const connection = createConnection({
    multipleStatements: true,
  });

  const mySqlVersion = await getMysqlVersion(connection);
  if (mySqlVersion.major < 8) {
    skip('MySQL >= 8.0 required to use CTE');
  }

  // the full result set will be over 6 MB uncompressed; about 490 KB with compression
  const largeQuery = `
    SET SESSION cte_max_recursion_depth = 100000;
    WITH RECURSIVE cte (n, s) AS (
      SELECT 1, 'this is just to cause more bytes transferred for each row'
      UNION ALL
      SELECT n + 1, s
      FROM cte
      WHERE n < 100000
    )
    SELECT * FROM cte;
  `;

  let resultRowsCount = 0;
  await new Promise<void>((resolve, reject) =>
    connection
      .query(largeQuery)
      .on('result', (row: RowDataPacket) => {
        resultRowsCount++;
        if (row.n === 1) {
          connection.pause();
          resolve();
        }
      })
      .on('error', reject)
  );

  // if backpressure is not working, the bytes received will grow during this time, even though connection is paused
  await sleep(500);

  try {
    assert.equal(resultRowsCount, 2, 'stop receiving result rows when paused');
  } finally {
    // @ts-expect-error: TODO: implement typings
    connection.close();
  }
});

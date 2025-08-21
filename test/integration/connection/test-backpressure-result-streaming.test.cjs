'use strict';

const { assert, test } = require('poku');
const common = require('../../common.test.cjs');
const timers = require('node:timers');

test('result event backpressure with pause/resume', async () => {
  const connection = common.createConnection({
    multipleStatements: true,
  });
  try {
    // in case wrapping with TLS, get the underlying socket first so we can see actual number of bytes read
    const originalSocket = connection.stream;

    // the full result set will be over 6 MB
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
    await new Promise((resolve, reject) =>
      connection
        .query(largeQuery)
        .on('result', (row) => {
          resultRowsCount++;
          if (row.n === 1) {
            connection.pause();
            resolve();
          }
        })
        .on('error', reject)
    );

    // if backpressure is not working, the bytes received will grow during this time, even though connection is paused
    await timers.promises.setTimeout(500);

    assert.equal(resultRowsCount, 2, 'stop receiving result rows when paused');

    // if backpressure is working, there should be less than 1 MB received;
    // experimentally it appears to be around 100 KB but may vary if buffer sizes change
    assert.ok(
      originalSocket.bytesRead < 1000000,
      `Received ${originalSocket.bytesRead} bytes on paused connection`
    );
  } finally {
    connection.close();
  }
});

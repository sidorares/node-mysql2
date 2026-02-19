import type { RowDataPacket } from '../../../index.js';
import { describe, it } from 'poku';
import { createConnection } from '../common.test.mjs';

await describe('Execute and Unprepare', async () => {
  const connection = createConnection();
  const [savedRows] = await connection
    .promise()
    .query<
      RowDataPacket[]
    >('SELECT @@GLOBAL.max_prepared_stmt_count as backup');
  const originalMaxPrepared = savedRows[0].backup;

  await it('should execute and unprepare repeatedly', async () => {
    await new Promise<void>((resolve, reject) => {
      const max = 500;
      function exec(i: number) {
        const query = `select 1+${i}`;
        connection.execute(query, (err) => {
          connection.unprepare(query);
          if (err) {
            return reject(err);
          }
          if (i > max) {
            resolve();
          } else {
            exec(i + 1);
          }
        });
      }
      connection.query('SET GLOBAL max_prepared_stmt_count=10', (err) => {
        if (err) {
          return reject(err);
        }
        exec(1);
      });
    });
  });

  await connection
    .promise()
    .query(`SET GLOBAL max_prepared_stmt_count=${originalMaxPrepared}`);

  connection.end();
});

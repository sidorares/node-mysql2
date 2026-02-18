import { describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Execute and Unprepare', async () => {
  await it('should execute and unprepare repeatedly', async () => {
    const connection = createConnection();

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
            connection.end();
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
});

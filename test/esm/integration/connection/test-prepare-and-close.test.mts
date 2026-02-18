import process from 'node:process';
import { describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Prepare and Close', async () => {
  await it('should prepare and close statements repeatedly', async () => {
    const connection = createConnection();

    await new Promise<void>((resolve, reject) => {
      const max = 500;
      const start = process.hrtime();
      function prepare(i: number) {
        connection.prepare(`select 1+${i}`, (err, stmt) => {
          if (err) return reject(err);
          stmt.close();
          if (i > max) {
            const end = process.hrtime(start);
            const ns = end[0] * 1e9 + end[1];
            console.log(`${(max * 1e9) / ns} prepares/sec`);
            connection.end();
            resolve();
            return;
          }
          setTimeout(() => {
            prepare(i + 1);
          }, 2);
        });
      }
      connection.query('SET GLOBAL max_prepared_stmt_count=10', (err) => {
        if (err) return reject(err);
        prepare(1);
      });
    });
  });
});

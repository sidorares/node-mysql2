import type { RowDataPacket } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

type TestRow = RowDataPacket & { t: number };

await describe('Execute Null Bitmap', async () => {
  const connection = createConnection();

  await it('should handle growing parameter lists', async () => {
    await new Promise<void>((resolve, reject) => {
      const params = [1, 2];
      let query = 'select ? + ?';

      function dotest() {
        connection.execute<TestRow[]>(`${query} as t`, params, (err, _rows) => {
          if (err) return reject(err);
          if (params.length < 50) {
            assert.equal(
              _rows[0].t,
              params.reduce((x: number, y: number) => x + y)
            );
            query += ' + ?';
            params.push(params.length);
            dotest();
          } else {
            connection.end();
            resolve();
          }
        });
      }

      connection.query('SET GLOBAL max_prepared_stmt_count=300', (err) => {
        if (err) return reject(err);
        dotest();
      });
    });
  });
});

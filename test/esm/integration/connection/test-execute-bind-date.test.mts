import type { RowDataPacket } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Execute Bind Date', async () => {
  const connection = createConnection();
  const date = new Date(2018, 2, 10, 15, 12, 34, 1234);

  await it('should bind date values correctly', async () => {
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.execute<RowDataPacket[]>(
        'SELECT CAST(? AS DATETIME(6)) AS result',
        [date],
        (err, _rows) => {
          if (err) return reject(err);
          resolve(_rows);
        }
      );
    });

    assert.deepEqual(rows, [{ result: date }]);
  });

  connection.end();
});

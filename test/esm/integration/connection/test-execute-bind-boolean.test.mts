import type { RowDataPacket } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Execute Bind Boolean', async () => {
  const connection = createConnection();

  await it('should bind boolean values correctly', async () => {
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.execute<RowDataPacket[]>(
        'SELECT ? AS trueValue, ? AS falseValue',
        [true, false],
        (err, _rows) => {
          if (err) return reject(err);
          resolve(_rows);
        }
      );
    });

    assert.deepEqual(rows, [{ trueValue: 1, falseValue: 0 }]);
  });

  connection.end();
});

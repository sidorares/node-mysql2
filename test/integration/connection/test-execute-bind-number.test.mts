import type { RowDataPacket } from '../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Execute Bind Number', async () => {
  const connection = createConnection();

  await it('should bind number values correctly', async () => {
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.execute<RowDataPacket[]>(
        'SELECT ? AS zeroValue, ? AS positiveValue, ? AS negativeValue, ? AS decimalValue',
        [0, 123, -123, 1.25],
        (err, _rows) => {
          if (err) return reject(err);
          resolve(_rows);
        }
      );
    });

    assert.deepEqual(rows, [
      {
        zeroValue: 0,
        positiveValue: 123,
        negativeValue: -123,
        decimalValue: 1.25,
      },
    ]);
  });

  connection.end();
});

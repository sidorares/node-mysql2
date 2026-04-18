import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Execute Bind Null', async () => {
  const connection = createConnection();

  await it('should bind null values correctly', async () => {
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.execute<RowDataPacket[]>(
        'SELECT ? AS firstValue, ? AS nullValue, ? AS lastValue',
        ['foo', null, 'bar'],
        (err, _rows) => {
          if (err) return reject(err);
          resolve(_rows);
        }
      );
    });

    strict.deepEqual(rows, [
      { firstValue: 'foo', nullValue: null, lastValue: 'bar' },
    ]);
  });

  connection.end();
});

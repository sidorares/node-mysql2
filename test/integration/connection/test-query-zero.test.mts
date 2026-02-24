import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Query Zero', async () => {
  await it('should return 0 as query parameter result', async () => {
    const connection = createConnection();
    let rows: RowDataPacket[];

    await new Promise<void>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        'SELECT ? AS result',
        0,
        (err, _rows) => {
          if (err) return reject(err);
          rows = _rows;
          connection.end();
          resolve();
        }
      );
    });

    strict.deepEqual(rows!, [{ result: 0 }]);
  });
});

import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Select UTF8', async () => {
  const connection = createConnection();

  await it('should select multibyte UTF8 text correctly', async () => {
    let rows: RowDataPacket[];
    const multibyteText = '本日は晴天なり';

    await new Promise<void>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        `SELECT '${multibyteText}' as result`,
        (err, _rows) => {
          if (err) return reject(err);
          rows = _rows;
          resolve();
        }
      );
    });

    strict.equal(rows![0].result, multibyteText);
  });

  connection.end();
});

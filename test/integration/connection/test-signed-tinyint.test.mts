import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Signed Tinyint', async () => {
  const connection = createConnection();

  connection.query(
    'CREATE TEMPORARY TABLE signed_ints  (b11 tinyint NOT NULL, b12 tinyint NOT NULL, b21 smallint NOT NULL)'
  );
  connection.query('INSERT INTO signed_ints values (-3, -120, 500)');
  connection.query('INSERT INTO signed_ints values (3,  -110, -500)');

  await it('should handle signed tinyint and smallint values', async () => {
    let rows: RowDataPacket[];

    await new Promise<void>((resolve, reject) => {
      connection.execute<RowDataPacket[]>(
        'SELECT * from signed_ints',
        [5],
        (err, _rows) => {
          if (err) return reject(err);
          rows = _rows;
          resolve();
        }
      );
    });

    strict.deepEqual(rows!, [
      { b11: -3, b12: -120, b21: 500 },
      { b11: 3, b12: -110, b21: -500 },
    ]);
  });

  connection.end();
});

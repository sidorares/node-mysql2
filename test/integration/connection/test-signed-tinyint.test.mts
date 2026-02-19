import type { RowDataPacket } from '../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Signed Tinyint', async () => {
  await it('should handle signed tinyint and smallint values', async () => {
    const connection = createConnection();

    let rows: RowDataPacket[];

    connection.query(
      'CREATE TEMPORARY TABLE signed_ints  (b11 tinyint NOT NULL, b12 tinyint NOT NULL, b21 smallint NOT NULL)'
    );
    connection.query('INSERT INTO signed_ints values (-3, -120, 500)');
    connection.query('INSERT INTO signed_ints values (3,  -110, -500)');

    await new Promise<void>((resolve, reject) => {
      connection.execute<RowDataPacket[]>(
        'SELECT * from signed_ints',
        [5],
        (err, _rows) => {
          if (err) return reject(err);
          rows = _rows;
          connection.end();
          resolve();
        }
      );
    });

    assert.deepEqual(rows!, [
      { b11: -3, b12: -120, b21: 500 },
      { b11: 3, b12: -110, b21: -500 },
    ]);
  });
});

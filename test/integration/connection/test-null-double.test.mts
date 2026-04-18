import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Null Double', async () => {
  const connection = createConnection();

  connection.query('CREATE TEMPORARY TABLE t (i int)');
  connection.query('INSERT INTO t VALUES(null)');
  connection.query('INSERT INTO t VALUES(123)');

  await it('should handle null and non-null values', async () => {
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>('SELECT * from t', (err, _rows) => {
        if (err) return reject(err);
        resolve(_rows);
      });
    });

    strict.deepEqual(rows[0], { i: null });
    strict.deepEqual(rows[1], { i: 123 });
  });

  connection.end();
});

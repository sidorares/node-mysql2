import type { RowDataPacket } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Null Int', async () => {
  const connection = createConnection();

  connection.query('CREATE TEMPORARY TABLE t (i int)');
  connection.query('INSERT INTO t VALUES(null)');
  connection.query('INSERT INTO t VALUES(123)');

  await it('should handle null and non-null int values', async () => {
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>('SELECT * from t', (err, _rows) => {
        if (err) return reject(err);
        resolve(_rows);
      });
    });

    assert.deepEqual(rows[0], { i: null });
    assert.deepEqual(rows[1], { i: 123 });
  });

  connection.end();
});

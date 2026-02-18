import type { FieldPacket, RowDataPacket } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Null', async () => {
  const connection = createConnection();

  connection.query('CREATE TEMPORARY TABLE t (i int)');
  connection.query('INSERT INTO t VALUES(null)');

  await it('should handle null values', async () => {
    await new Promise<void>((resolve, reject) => {
      let rows: RowDataPacket[];
      let rows1: RowDataPacket[];
      let fields1: FieldPacket[];

      connection.query<RowDataPacket[]>(
        'SELECT cast(NULL AS CHAR) as cast_result',
        (err, _rows) => {
          if (err) return reject(err);
          rows = _rows;
        }
      );
      connection.query<RowDataPacket[]>(
        'SELECT * from t',
        (err, _rows, _fields) => {
          if (err) return reject(err);
          rows1 = _rows;
          fields1 = _fields;

          assert.deepEqual(rows, [{ cast_result: null }]);
          // assert.equal(fields[0].columnType, 253); // depeding on the server type could be 253 or 3, disabling this check for now
          assert.deepEqual(rows1, [{ i: null }]);
          assert.equal(fields1[0].columnType, 3);

          connection.end();
          resolve();
        }
      );
    });
  });
});

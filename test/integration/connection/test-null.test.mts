import type { FieldPacket, RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Null', async () => {
  const connection = createConnection();

  connection.query('CREATE TEMPORARY TABLE t (i int)');
  connection.query('INSERT INTO t VALUES(null)');

  await it('should handle null values', async () => {
    const castRows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        'SELECT cast(NULL AS CHAR) as cast_result',
        (err, _rows) => (err ? reject(err) : resolve(_rows))
      );
    });

    const [rows1, fields1] = await new Promise<
      [RowDataPacket[], FieldPacket[]]
    >((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        'SELECT * from t',
        (err, _rows, _fields) => (err ? reject(err) : resolve([_rows, _fields]))
      );
    });

    strict.deepEqual(castRows, [{ cast_result: null }]);
    // strict.equal(fields[0].columnType, 253); // depeding on the server type could be 253 or 3, disabling this check for now
    strict.deepEqual(rows1, [{ i: null }]);
    strict.equal(fields1[0].columnType, 3);
  });

  connection.end();
});

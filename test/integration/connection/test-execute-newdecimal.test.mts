import type { FieldPacket, RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Execute New Decimal', async () => {
  const connection = createConnection();

  connection.query('CREATE TEMPORARY TABLE t (f DECIMAL(19,4))');
  connection.query('INSERT INTO t VALUES(12345.67)');

  await it('should return decimal values correctly', async () => {
    const [rows, fields] = await new Promise<[RowDataPacket[], FieldPacket[]]>(
      (resolve, reject) => {
        connection.execute<RowDataPacket[]>(
          'SELECT f FROM t',
          (err, _rows, _fields) => {
            if (err) return reject(err);
            resolve([_rows, _fields]);
          }
        );
      }
    );

    strict.deepEqual(rows, [{ f: '12345.6700' }]);
    strict.equal(fields[0].name, 'f');
  });

  connection.end();
});

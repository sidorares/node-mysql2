import type { RowDataPacket } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Execute New Decimal', async () => {
  const connection = createConnection();

  connection.query('CREATE TEMPORARY TABLE t (f DECIMAL(19,4))');
  connection.query('INSERT INTO t VALUES(12345.67)');

  await it('should return decimal values correctly', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.execute<RowDataPacket[]>(
        'SELECT f FROM t',
        (err, rows, fields) => {
          if (err) return reject(err);
          assert.deepEqual(rows, [{ f: '12345.6700' }]);
          assert.equal(fields[0].name, 'f');
          connection.end();
          resolve();
        }
      );
    });
  });
});

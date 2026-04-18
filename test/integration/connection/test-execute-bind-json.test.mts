import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Execute Bind JSON', async () => {
  const connection = createConnection();
  const table = 'jsontable';
  const testJson = [{ a: 1, b: true, c: ['foo'] }];

  connection.query(`CREATE TEMPORARY TABLE ${table} (data JSON)`);
  connection.query(
    `INSERT INTO ${table} (data) VALUES ('${JSON.stringify(testJson)}')`
  );

  await it('should bind JSON values correctly', async () => {
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.execute<RowDataPacket[]>(
        `SELECT * from ${table}`,
        (err, _rows) => {
          if (err) return reject(err);
          resolve(_rows);
        }
      );
    });

    strict.deepEqual(rows, [{ data: testJson }]);
  });

  connection.end();
});

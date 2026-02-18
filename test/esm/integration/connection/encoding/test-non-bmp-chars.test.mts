import type { FieldPacket, RowDataPacket } from '../../../../../index.js';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../../common.test.mjs';

type UtfRow = RowDataPacket & Record<string, string>;

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale');
  process.exit(0);
}

await describe('Non BMP Chars', async () => {
  // 4 bytes in utf8
  const pileOfPoo = '💩';

  await it('should handle non-BMP chars with UTF8_GENERAL_CI', async () => {
    const connection = createConnection({ charset: 'UTF8_GENERAL_CI' });
    await new Promise<void>((resolve, reject) => {
      connection.query<UtfRow[]>(
        'select "💩"',
        (err, rows, fields: FieldPacket[]) => {
          if (err) return reject(err);
          assert.equal(fields[0].name, pileOfPoo);
          assert.equal(rows[0][fields[0].name], pileOfPoo);
          connection.end();
          resolve();
        }
      );
    });
  });

  await it('should handle non-BMP chars with UTF8MB4_GENERAL_CI', async () => {
    const connection2 = createConnection({ charset: 'UTF8MB4_GENERAL_CI' });
    await new Promise<void>((resolve, reject) => {
      connection2.query<UtfRow[]>(
        'select "💩"',
        (err, rows, fields: FieldPacket[]) => {
          if (err) return reject(err);
          assert.equal(fields[0].name, '?');
          assert.equal(rows[0]['?'], pileOfPoo);
          connection2.end();
          resolve();
        }
      );
    });
  });
});

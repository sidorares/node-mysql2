import type { FieldPacket, RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert, describe, it, skip } from 'poku';
import { createConnection } from '../../../common.test.mjs';

type UtfRow = RowDataPacket & Record<string, string>;

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('Skipping test for PlanetScale');
}

await describe('Non BMP Chars', async () => {
  // 4 bytes in utf8
  const pileOfPoo = '💩';

  await it('should handle non-BMP chars with UTF8_GENERAL_CI', async () => {
    const connection = createConnection({ charset: 'UTF8_GENERAL_CI' });
    const [rows, fields] = await new Promise<[UtfRow[], FieldPacket[]]>(
      (resolve, reject) => {
        connection.query<UtfRow[]>('select "💩"', (err, _rows, _fields) =>
          err ? reject(err) : resolve([_rows, _fields])
        );
      }
    );

    assert.equal(fields[0].name, pileOfPoo);
    assert.equal(rows[0][fields[0].name], pileOfPoo);
    connection.end();
  });

  await it('should handle non-BMP chars with UTF8MB4_GENERAL_CI', async () => {
    const connection2 = createConnection({ charset: 'UTF8MB4_GENERAL_CI' });
    const [rows, fields] = await new Promise<[UtfRow[], FieldPacket[]]>(
      (resolve, reject) => {
        connection2.query<UtfRow[]>('select "💩"', (err, _rows, _fields) =>
          err ? reject(err) : resolve([_rows, _fields])
        );
      }
    );

    assert.equal(fields[0].name, '?');
    assert.equal(rows[0]['?'], pileOfPoo);
    connection2.end();
  });
});

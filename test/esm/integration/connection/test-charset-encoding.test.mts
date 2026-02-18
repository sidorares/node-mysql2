import type { RowDataPacket } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

type CharsetRow = RowDataPacket & { field: string };

await describe('Charset Encoding', async () => {
  const connection = createConnection();

  // test data stores
  const testData = [
    'ютф восемь',
    'Experimental',
    'परीक्षण',
    'test тест テスト փորձաsրկում পরীক্ষা kiểm tra',
    'ტესტი પરીક્ષણ  מבחן פּרובירן اختبار',
  ];

  // test inserting of non latin data if we are able to parse it
  await it('should preserve non-latin character encoding', async () => {
    let resultData: CharsetRow[] | undefined;

    await new Promise<void>((resolve, reject) => {
      connection.query('DROP TABLE IF EXISTS `test-charset-encoding`', () => {
        connection.query(
          'CREATE TABLE IF NOT EXISTS `test-charset-encoding` ' +
            '( `field` VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)',
          (err) => {
            if (err) return reject(err);
            connection.query('DELETE from `test-charset-encoding`', (err) => {
              if (err) return reject(err);

              testData.forEach((data) => {
                connection.query(
                  'INSERT INTO `test-charset-encoding` (field) values(?)',
                  [data],
                  (err2) => {
                    if (err2) return reject(err2);
                  }
                );
              });

              connection.query<CharsetRow[]>(
                'SELECT * from `test-charset-encoding`',
                (err, results) => {
                  if (err) return reject(err);
                  resultData = results;
                  connection.end();
                  resolve();
                }
              );
            });
          }
        );
      });
    });

    resultData?.forEach((data: CharsetRow, index: number) => {
      assert.equal(data.field, testData[index]);
    });
  });
});

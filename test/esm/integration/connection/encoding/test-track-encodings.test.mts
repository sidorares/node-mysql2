import type { RowDataPacket } from '../../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../../common.test.mjs';

await describe('Track Encodings', async () => {
  const connection = createConnection({ charset: 'UTF8MB4_GENERAL_CI' });
  const text = 'привет, мир';

  await it('should track koi8r encoding', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query('SET character_set_client=koi8r', (err) => {
        if (err) return reject(err);
        connection.query<RowDataPacket[]>(
          `SELECT ? as result`,
          [text],
          (err, rows) => {
            if (err) return reject(err);
            assert.equal(rows[0].result, text);
            resolve();
          }
        );
      });
    });
  });

  await it('should track cp1251 encoding', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query('SET character_set_client=cp1251', (err) => {
        if (err) return reject(err);
        connection.query<RowDataPacket[]>(
          `SELECT ? as result`,
          [text],
          (err, rows) => {
            if (err) return reject(err);
            assert.equal(rows[0].result, text);
            resolve();
          }
        );
      });
    });
  });

  connection.end();
});

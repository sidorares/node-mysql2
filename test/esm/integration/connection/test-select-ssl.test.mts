import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

type SslCipherRow = RowDataPacket & {
  Variable_name: string;
  Value: string;
};

await describe('Select SSL', async () => {
  await it('should check SSL cipher status via query and execute', async () => {
    const connection = createConnection();

    await new Promise<void>((resolve, reject) => {
      connection.query<SslCipherRow[]>(
        `SHOW STATUS LIKE 'Ssl_cipher'`,
        (err, rows) => {
          if (err) return reject(err);
          if (process.env.MYSQL_USE_TLS === '1') {
            assert.equal(rows[0].Value.length > 0, true);
          } else {
            assert.deepEqual(rows, [
              { Variable_name: 'Ssl_cipher', Value: '' },
            ]);
          }

          connection.execute<SslCipherRow[]>(
            `SHOW STATUS LIKE 'Ssl_cipher'`,
            (err, rows) => {
              if (err) return reject(err);
              if (process.env.MYSQL_USE_TLS === '1') {
                assert.equal(rows[0].Value.length > 0, true);
              } else {
                assert.deepEqual(rows, [
                  { Variable_name: 'Ssl_cipher', Value: '' },
                ]);
              }

              connection.end((err) => {
                if (err) return reject(err);
                resolve();
              });
            }
          );
        }
      );
    });
  });
});

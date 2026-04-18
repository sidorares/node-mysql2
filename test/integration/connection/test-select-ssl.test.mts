import type { RowDataPacket } from '../../../index.js';
import process from 'node:process';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type SslCipherRow = RowDataPacket & {
  Variable_name: string;
  Value: string;
};

await describe('Select SSL', async () => {
  const connection = createConnection();

  await it('should check SSL cipher status via query and execute', async () => {
    const queryRows = await new Promise<SslCipherRow[]>((resolve, reject) => {
      connection.query<SslCipherRow[]>(
        `SHOW STATUS LIKE 'Ssl_cipher'`,
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });

    if (process.env.MYSQL_USE_TLS === '1') {
      strict.equal(queryRows[0].Value.length > 0, true);
    } else {
      strict.deepEqual(queryRows, [{ Variable_name: 'Ssl_cipher', Value: '' }]);
    }

    const executeRows = await new Promise<SslCipherRow[]>((resolve, reject) => {
      connection.execute<SslCipherRow[]>(
        `SHOW STATUS LIKE 'Ssl_cipher'`,
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });

    if (process.env.MYSQL_USE_TLS === '1') {
      strict.equal(executeRows[0].Value.length > 0, true);
    } else {
      strict.deepEqual(executeRows, [
        { Variable_name: 'Ssl_cipher', Value: '' },
      ]);
    }
  });

  connection.end();
});

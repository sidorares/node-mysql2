import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

type SslCipherRow = RowDataPacket & {
  Variable_name: string;
  Value: string;
};

const connection = createConnection();

connection.query<SslCipherRow[]>(
  `SHOW STATUS LIKE 'Ssl_cipher'`,
  (err, rows) => {
    assert.ifError(err);
    if (process.env.MYSQL_USE_TLS === '1') {
      assert.equal(rows[0].Value.length > 0, true);
    } else {
      assert.deepEqual(rows, [{ Variable_name: 'Ssl_cipher', Value: '' }]);
    }

    connection.execute<SslCipherRow[]>(
      `SHOW STATUS LIKE 'Ssl_cipher'`,
      (err, rows) => {
        assert.ifError(err);
        if (process.env.MYSQL_USE_TLS === '1') {
          assert.equal(rows[0].Value.length > 0, true);
        } else {
          assert.deepEqual(rows, [{ Variable_name: 'Ssl_cipher', Value: '' }]);
        }

        connection.end((err) => {
          assert.ifError(err);
          process.exit(0);
        });
      }
    );
  }
);

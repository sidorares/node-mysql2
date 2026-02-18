import type { RowDataPacket } from '../../../../../index.js';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale (unsupported non utf8 charsets)');
  process.exit(0);
}

await describe('Client Encodings', async () => {
  const connection = createConnection({ charset: 'UTF8MB4_GENERAL_CI' });

  await new Promise<void>((resolve, reject) => {
    connection.query('drop table if exists __test_client_encodings');
    connection.query(
      'create table if not exists __test_client_encodings (name VARCHAR(200)) CHARACTER SET=utf8mb4',
      (err) => {
        if (err) return reject(err);
        connection.query('delete from __test_client_encodings', (err) => {
          if (err) return reject(err);
          connection.end();
          resolve();
        });
      }
    );
  });

  await it('should preserve encoding across different client charsets', async () => {
    const connection1 = createConnection({ charset: 'CP1251_GENERAL_CI' });
    await new Promise<void>((resolve, reject) => {
      connection1.query(
        'insert into __test_client_encodings values("привет, мир")',
        (err) => {
          if (err) return reject(err);
          connection1.end();
          resolve();
        }
      );
    });

    const connection2 = createConnection({ charset: 'KOI8R_GENERAL_CI' });
    await new Promise<void>((resolve, reject) => {
      connection2.query<RowDataPacket[]>(
        'select * from __test_client_encodings',
        (err, rows) => {
          if (err) return reject(err);
          assert.equal(rows[0].name, 'привет, мир');
          connection2.end();
          resolve();
        }
      );
    });
  });
});

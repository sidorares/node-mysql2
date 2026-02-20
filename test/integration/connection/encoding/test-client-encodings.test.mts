import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert, describe, it, skip } from 'poku';
import { createConnection } from '../../../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('PlanetScale: unsupported non-UTF8 charsets');
}

await describe('Client Encodings', async () => {
  const connection = createConnection({ charset: 'UTF8MB4_GENERAL_CI' });

  connection.query('drop table if exists __test_client_encodings');

  await new Promise<void>((resolve, reject) => {
    connection.query(
      'create table if not exists __test_client_encodings (name VARCHAR(200)) CHARACTER SET=utf8mb4',
      (err) => (err ? reject(err) : resolve())
    );
  });

  await new Promise<void>((resolve, reject) => {
    connection.query('delete from __test_client_encodings', (err) =>
      err ? reject(err) : resolve()
    );
  });

  connection.end();

  await it('should preserve encoding across different client charsets', async () => {
    const connection1 = createConnection({ charset: 'CP1251_GENERAL_CI' });
    await new Promise<void>((resolve, reject) => {
      connection1.query(
        'insert into __test_client_encodings values("привет, мир")',
        (err) => (err ? reject(err) : resolve())
      );
    });
    connection1.end();

    const connection2 = createConnection({ charset: 'KOI8R_GENERAL_CI' });
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection2.query<RowDataPacket[]>(
        'select * from __test_client_encodings',
        (err, _rows) => (err ? reject(err) : resolve(_rows))
      );
    });

    assert.equal(rows[0].name, 'привет, мир');
    connection2.end();
  });
});

import type {
  RowDataPacket,
  TypeCastField,
  TypeCastNext,
} from '../../../index.js';
import { describe, it, skip, strict } from 'poku';
import { createConnection, getMysqlVersion } from '../../common.test.mjs';

const typeCastWrapper = function (
  ...args: [encoding?: BufferEncoding | string | undefined]
) {
  return function (field: TypeCastField, next: TypeCastNext) {
    if (field.type === 'JSON') {
      return JSON.parse(field.string(...args) ?? '');
    }

    return next();
  };
};

await describe('Text Parser: typeCast with JSON fields', async () => {
  const connection = createConnection();
  const { isMariaDB } = await getMysqlVersion(connection);

  if (isMariaDB) {
    await connection.promise().end();
    // MariaDB JSON columns are utf8mb4 LONGTEXT, so the MySQL-specific
    // binary-charset footgun tested here does not exist there
    skip('MariaDB does not report JSON columns with the BINARY charset');
  }

  connection.query('CREATE TEMPORARY TABLE t (i JSON)');
  connection.query('INSERT INTO t values(\'{ "test": "😀" }\')');

  await it('JSON without encoding options - should result in unexpected behaviors', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        {
          sql: 'SELECT * FROM t',
          typeCast: typeCastWrapper(),
        },
        (err, rows) => {
          if (err) return reject(err);
          strict.notEqual(rows[0].i.test, '😀');
          resolve();
        }
      );
    });
  });

  await it('JSON with encoding explicitly set to utf8', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        {
          sql: 'SELECT * FROM t',
          typeCast: typeCastWrapper('utf8'),
        },
        (err, rows) => {
          if (err) return reject(err);
          strict.equal(rows[0].i.test, '😀');
          resolve();
        }
      );
    });
  });

  connection.end();
});

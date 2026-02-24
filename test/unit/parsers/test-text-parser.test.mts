import type {
  RowDataPacket,
  TypeCastField,
  TypeCastNext,
} from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

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

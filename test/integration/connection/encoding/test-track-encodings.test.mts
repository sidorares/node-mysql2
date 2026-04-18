import type { RowDataPacket } from '../../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../../common.test.mjs';

await describe('Track Encodings', async () => {
  const connection = createConnection({ charset: 'UTF8MB4_GENERAL_CI' });
  const text = 'привет, мир';

  await it('should track koi8r encoding', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query('SET character_set_client=koi8r', (err) =>
        err ? reject(err) : resolve()
      );
    });

    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        `SELECT ? as result`,
        [text],
        (err, _rows) => (err ? reject(err) : resolve(_rows))
      );
    });

    strict.equal(rows[0].result, text);
  });

  await it('should track cp1251 encoding', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query('SET character_set_client=cp1251', (err) =>
        err ? reject(err) : resolve()
      );
    });

    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        `SELECT ? as result`,
        [text],
        (err, _rows) => (err ? reject(err) : resolve(_rows))
      );
    });

    strict.equal(rows[0].result, text);
  });

  connection.end();
});

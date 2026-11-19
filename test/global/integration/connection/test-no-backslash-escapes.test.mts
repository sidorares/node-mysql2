import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { describe, it, skip, strict } from 'poku';
import { createConnection } from '../../../common.test.mjs';

type ValueRow = RowDataPacket & { value: string };

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('PlanetScale does not support SET GLOBAL');
}

const value = "C:\\dir\\ it's";
const noBackslashEscapes = { noBackslashEscapes: true };

await describe('NO_BACKSLASH_ESCAPES in the global SQL mode', async () => {
  const admin = createConnection().promise();
  const [savedRows] = await admin.query<RowDataPacket[]>(
    'SELECT @@GLOBAL.sql_mode AS backup'
  );
  const originalSqlMode = savedRows[0].backup;

  await admin.query(
    "SET GLOBAL sql_mode = CONCAT(@@GLOBAL.sql_mode, ',NO_BACKSLASH_ESCAPES')"
  );

  await describe('a query sent before the handshake', async () => {
    const connection = createConnection(noBackslashEscapes).promise();
    const select = connection.query<ValueRow[]>('SELECT ? AS value', [value]);

    await it('should keep the value as it was', async () => {
      const [rows] = await select;

      strict.equal(rows[0].value, value);
    });

    await connection.end();
  });

  await describe('a change of user', async () => {
    const connection = createConnection(noBackslashEscapes).promise();

    await it('should keep a value as it was in the mode it restores', async () => {
      await connection.query("SET SESSION sql_mode = ''");
      await connection.changeUser({});

      const [rows] = await connection.query<ValueRow[]>('SELECT ? AS value', [
        value,
      ]);

      strict.equal(rows[0].value, value);
    });

    await connection.end();
  });

  await admin.query('SET GLOBAL sql_mode = ?', [originalSqlMode]);
  await admin.end();
});

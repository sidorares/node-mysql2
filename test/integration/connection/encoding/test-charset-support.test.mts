import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { describe, it, skip, strict } from 'poku';
import { createConnection } from '../../../common.test.mjs';

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('PlanetScale: unsupported non-UTF8 charsets');
}

type DecodedRow = RowDataPacket & Record<string, string>;
type EchoRow = RowDataPacket & { bytes: string; text: string };

const toHex = (byte: number) =>
  byte.toString(16).toUpperCase().padStart(2, '0');

await describe('HP8 connections follow the server hp8 table', async () => {
  const candidates = Array.from({ length: 256 - 0x20 }, (_, i) => 0x20 + i);
  const utf8Connection = createConnection().promise();
  const [[decoded]] = await utf8Connection.query<DecodedRow[]>(
    `SELECT ${candidates
      .map(
        (byte) =>
          `CONVERT(CONVERT(X'${toHex(byte)}' USING hp8) USING utf8mb4) AS b${byte}`
      )
      .join(', ')}`
  );
  await utf8Connection.end();

  const defined = candidates
    .map((byte) => ({ byte, char: decoded[`b${byte}`] }))
    .filter(({ byte, char }) => char !== '?' || byte === 0x3f);
  const text = defined.map(({ char }) => char).join('');
  const bytes = defined.map(({ byte }) => toHex(byte)).join('');

  const connection = createConnection({ charset: 'HP8' }).promise();

  await it('sends every hp8 character as the byte the server expects', async () => {
    const [rows] = await connection.query<EchoRow[]>(
      'SELECT HEX(?) AS bytes, ? AS text',
      [text, text]
    );

    strict.equal(rows[0].bytes, bytes);
    strict.equal(rows[0].text, text);
  });

  await it('sends parameters of prepared statements in hp8', async () => {
    const [rows] = await connection.execute<EchoRow[]>(
      'SELECT HEX(?) AS bytes, ? AS text',
      [text, text]
    );

    strict.equal(rows[0].bytes, bytes);
    strict.equal(rows[0].text, text);
  });

  await it('keeps SQL punctuation intact', async () => {
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS n, -1.5 AS d FROM (SELECT 1 UNION SELECT 2) AS t'
    );

    strict.equal(rows[0].n, 2);
    strict.equal(rows[0].d, '-1.5');
  });

  await connection.end();
});

await describe('Charsets without a matching encoder', async () => {
  const connection = createConnection().promise();

  for (const charset of [
    'ARMSCII8',
    'DEC8',
    'EUCJPMS',
    'GEOSTD8',
    'KEYBCS2',
    'SWE7',
  ]) {
    await it(`refuses changeUser to ${charset}`, async () => {
      await strict.rejects(
        connection.changeUser({ charset }),
        (err: unknown) =>
          err instanceof TypeError &&
          err.message.startsWith(
            `Unsupported charset '${charset.toLowerCase()}'`
          )
      );
    });
  }

  await it('keeps the connection usable after a refused changeUser', async () => {
    const [rows] = await connection.query<RowDataPacket[]>('SELECT 1 + 1 AS n');

    strict.equal(rows[0].n, 2);
  });

  await connection.end();
});

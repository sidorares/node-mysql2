import type { FieldPacket, RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { describe, it, skip, strict } from 'poku';
import mysql from '../../../../index.js';
import { createConnection } from '../../../common.test.mjs';

type PayloadRow = RowDataPacket & Record<string, string>;

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('PlanetScale: unsupported non-UTF8 charsets');
}

await describe('Charset Results', async () => {
  const connection = createConnection();
  const payload = 'привет, мир';

  async function tryEncoding(encoding: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      connection.query('set character_set_results = ?', [encoding], (err) =>
        err ? reject(err) : resolve()
      );
    });

    const [rows, fields] = await new Promise<[PayloadRow[], FieldPacket[]]>(
      (resolve, reject) => {
        connection.query<PayloadRow[]>(
          'SELECT ?',
          [payload],
          (err, _rows, _fields) =>
            err ? reject(err) : resolve([_rows, _fields])
        );
      }
    );

    if (!fields || fields.length === 0) {
      strict.fail('Expected metadata fields');
    }
    const firstField = fields[0];
    const characterSet = firstField.characterSet;
    if (characterSet === undefined) {
      strict.fail('Expected characterSet metadata');
    }
    let iconvEncoding = encoding;
    if (encoding === 'utf8mb4') {
      iconvEncoding = 'utf8';
    }
    strict.equal(mysql.CharsetToEncoding[characterSet], iconvEncoding);
    strict.equal(firstField.name, payload);
    strict.equal(rows[0][firstField.name], payload);
  }

  async function tryEncodingExecute(encoding: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      connection.execute('set character_set_results = ?', [encoding], (err) =>
        err ? reject(err) : resolve()
      );
    });

    const [rows, fields] = await new Promise<[PayloadRow[], FieldPacket[]]>(
      (resolve, reject) => {
        connection.execute<PayloadRow[]>(
          'SELECT ? as n',
          [payload],
          (err, _rows, _fields) =>
            err ? reject(err) : resolve([_rows, _fields as FieldPacket[]])
        );
      }
    );

    if (!fields || fields.length === 0) {
      strict.fail('Expected metadata fields');
    }
    const firstField = fields[0];
    const characterSet = firstField.characterSet;
    if (characterSet === undefined) {
      strict.fail('Expected characterSet metadata');
    }
    let iconvEncoding = encoding;
    if (encoding === 'utf8mb4') {
      iconvEncoding = 'utf8';
    }
    strict.equal(mysql.CharsetToEncoding[characterSet], iconvEncoding);
    // TODO: figure out correct metadata encodings setup for binary protocol
    //  strict.equal(firstField.name, payload);
    strict.equal(rows[0][firstField.name], payload);
  }

  const encodings = ['cp1251', 'koi8r', 'cp866', 'utf8mb4'];

  for (const encoding of encodings) {
    await it(`query with ${encoding} encoding`, async () => {
      await tryEncoding(encoding);
    });
  }

  for (const encoding of encodings) {
    await it(`execute with ${encoding} encoding`, async () => {
      await tryEncodingExecute(encoding);
    });
  }

  connection.end();
});

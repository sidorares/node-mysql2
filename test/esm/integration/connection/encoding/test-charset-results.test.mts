import type { RowDataPacket } from '../../../../../index.js';
import process from 'node:process';
import { assert, describe, it } from 'poku';
import mysql from '../../../../../index.js';
import { createConnection } from '../../../common.test.mjs';

type PayloadRow = RowDataPacket & Record<string, string>;

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale (unsupported non utf8 charsets)');
  process.exit(0);
}

await describe('Charset Results', async () => {
  const connection = createConnection();
  const payload = 'привет, мир';

  function tryEncoding(encoding: string): Promise<void> {
    return new Promise((resolve, reject) => {
      connection.query('set character_set_results = ?', [encoding], (err) => {
        if (err) return reject(err);
        connection.query<PayloadRow[]>(
          'SELECT ?',
          [payload],
          (err, rows, fields) => {
            if (err) return reject(err);
            if (!fields || fields.length === 0) {
              assert.fail('Expected metadata fields');
            }
            const firstField = fields[0];
            const characterSet = firstField.characterSet;
            if (characterSet === undefined) {
              assert.fail('Expected characterSet metadata');
            }
            let iconvEncoding = encoding;
            if (encoding === 'utf8mb4') {
              iconvEncoding = 'utf8';
            }
            assert.equal(mysql.CharsetToEncoding[characterSet], iconvEncoding);
            assert.equal(firstField.name, payload);
            assert.equal(rows[0][firstField.name], payload);
            resolve();
          }
        );
      });
    });
  }

  function tryEncodingExecute(encoding: string): Promise<void> {
    return new Promise((resolve, reject) => {
      connection.execute('set character_set_results = ?', [encoding], (err) => {
        if (err) return reject(err);
        connection.execute<PayloadRow[]>(
          'SELECT ? as n',
          [payload],
          (err, rows, fields) => {
            if (err) return reject(err);
            if (!fields || fields.length === 0) {
              assert.fail('Expected metadata fields');
            }
            const firstField = fields[0];
            const characterSet = firstField.characterSet;
            if (characterSet === undefined) {
              assert.fail('Expected characterSet metadata');
            }
            let iconvEncoding = encoding;
            if (encoding === 'utf8mb4') {
              iconvEncoding = 'utf8';
            }
            assert.equal(mysql.CharsetToEncoding[characterSet], iconvEncoding);
            // TODO: figure out correct metadata encodings setup for binary protocol
            //  assert.equal(firstField.name, payload);
            assert.equal(rows[0][firstField.name], payload);
            resolve();
          }
        );
      });
    });
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

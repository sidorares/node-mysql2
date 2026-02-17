import type { RowDataPacket } from '../../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import mysql from '../../../../../index.js';
import { createConnection } from '../../../common.test.mjs';

type PayloadRow = RowDataPacket & Record<string, string>;

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  console.log('skipping test for planetscale (unsupported non utf8 charsets)');
  process.exit(0);
}

const connection = createConnection();

const payload = 'привет, мир';
function tryEncoding(encoding: string, cb: () => void) {
  connection.query('set character_set_results = ?', [encoding], (err) => {
    assert.ifError(err);
    connection.query<PayloadRow[]>(
      'SELECT ?',
      [payload],
      (err, rows, fields) => {
        assert.ifError(err);
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
        cb();
      }
    );
  });
}

function tryEncodingExecute(encoding: string, cb: () => void) {
  connection.execute('set character_set_results = ?', [encoding], (err) => {
    assert.ifError(err);
    connection.execute<PayloadRow[]>(
      'SELECT ? as n',
      [payload],
      (err, rows, fields) => {
        assert.ifError(err);
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
        cb();
      }
    );
  });
}

// christmas tree!!! :)
tryEncoding('cp1251', () => {
  tryEncoding('koi8r', () => {
    tryEncoding('cp866', () => {
      tryEncoding('utf8mb4', () => {
        tryEncodingExecute('cp1251', () => {
          tryEncodingExecute('koi8r', () => {
            tryEncodingExecute('cp866', () => {
              tryEncodingExecute('utf8mb4', () => {
                connection.end();
              });
            });
          });
        });
      });
    });
  });
});

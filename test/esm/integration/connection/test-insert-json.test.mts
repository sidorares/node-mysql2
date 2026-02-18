/**
 * Created by Elijah Melton on 2023.05.03
 * issue#1924: https://github.com/sidorares/node-mysql2/issues/1924
 */

import type { RowDataPacket } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

type JsonRow = RowDataPacket & { data: { k: string } };

await describe('Insert JSON', async () => {
  const connection = createConnection();

  connection.query('CREATE TEMPORARY TABLE json_test (data JSON)');

  let errorCodeInvalidJSON: string | undefined;
  let errorNumInvalidJSON: number | undefined;

  await it('should handle JSON insert and invalid JSON error', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query(
        'INSERT INTO json_test VALUES (?)',
        ['{"k": "v"'],
        (err) => {
          errorCodeInvalidJSON = err?.code;
          errorNumInvalidJSON = err?.errno;
        }
      );

      connection.query(
        'INSERT INTO json_test VALUES (?)',
        ['{"k": "v"}'],
        (err) => {
          if (err) return reject(err);
        }
      );

      connection.query<JsonRow[]>(
        'SELECT * FROM json_test;',
        [],
        (err, res) => {
          if (err) return reject(err);

          assert.equal(errorCodeInvalidJSON, 'ER_INVALID_JSON_TEXT');
          assert.equal(errorNumInvalidJSON, 3140);
          assert.equal(res?.[0].data.k, 'v');

          connection.end();
          resolve();
        }
      );
    });
  });
});

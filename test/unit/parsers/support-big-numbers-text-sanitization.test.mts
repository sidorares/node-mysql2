import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type TotalRow = RowDataPacket & { total: number | string };

await describe('Text Parser: supportBigNumbers Sanitization', async () => {
  const connection = createConnection().promise();

  const sql = 'SELECT 9007199254740991+100 AS `total`';
  const cases: [boolean, string, string][] = [
    [true, 'string', 'Valid supportBigNumbers enabled'],
    [false, 'number', 'Valid supportBigNumbers disabled'],
    [
      // @ts-expect-error: testing sanitization with invalid string value
      'text',
      'string',
      'supportBigNumbers as a random string should be enabled',
    ],
    [
      // @ts-expect-error: testing sanitization with invalid string value
      '',
      'number',
      'supportBigNumbers as an empty string should be disabled',
    ],
  ];

  for (const [supportBigNumbers, expectedType, label] of cases) {
    await it(label, async () => {
      const [results] = await connection.query<TotalRow[]>({
        sql,
        // @ts-expect-error: TODO: implement typings
        supportBigNumbers,
      });

      strict.strictEqual(typeof results[0].total, expectedType, label);
    });
  }

  await connection.end();
});

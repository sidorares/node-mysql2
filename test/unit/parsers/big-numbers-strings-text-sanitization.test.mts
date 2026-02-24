import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type TotalRow = RowDataPacket & { total: number | string };

await describe('Text Parser: bigNumberStrings Sanitization', async () => {
  const connection = createConnection().promise();

  const sql = 'SELECT 9007199254740991+100 AS `total`';

  const cases: [Record<string, boolean>, string, string][] = [
    [
      { supportBigNumbers: true, bigNumberStrings: true },
      'string',
      'Valid bigNumberStrings enabled',
    ],
    [
      { supportBigNumbers: false, bigNumberStrings: false },
      'number',
      'Valid bigNumberStrings disabled',
    ],
    [
      // @ts-expect-error: testing sanitization with invalid string value
      { supportBigNumbers: 'text', bigNumberStrings: 'text' },
      'string',
      'bigNumberStrings as a random string should be enabled',
    ],
    [
      // @ts-expect-error: testing sanitization with invalid string value
      { supportBigNumbers: '', bigNumberStrings: '' },
      'number',
      'bigNumberStrings as an empty string should be disabled',
    ],
  ];

  for (const [options, expectedType, label] of cases) {
    await it(label, async () => {
      const [results] = await connection.query<TotalRow[]>({ sql, ...options });

      strict.strictEqual(typeof results[0].total, expectedType, label);
    });
  }

  await connection.end();
});

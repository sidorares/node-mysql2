import { describe, it, assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Text Parser: bigNumberStrings Sanitization', async () => {
  const connection = createConnection().promise();

  const sql = 'SELECT 9007199254740991+100 AS `total`';

  const cases: [Record<string, any>, string, string][] = [
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
      { supportBigNumbers: 'text', bigNumberStrings: 'text' },
      'string',
      'bigNumberStrings as a random string should be enabled',
    ],
    [
      { supportBigNumbers: '', bigNumberStrings: '' },
      'number',
      'bigNumberStrings as an empty string should be disabled',
    ],
  ];

  for (const [options, expectedType, label] of cases) {
    await it(label, async () => {
      const [results] = await connection.query({ sql, ...options });

      assert.strictEqual(typeof results[0].total, expectedType, label);
    });
  }

  await connection.end();
});

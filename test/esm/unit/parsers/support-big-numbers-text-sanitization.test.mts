import { describe, it, assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

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
      const [results] = await connection.query({
        sql,
        supportBigNumbers,
      });

      assert.strictEqual(typeof results[0].total, expectedType, label);
    });
  }

  await connection.end();
});

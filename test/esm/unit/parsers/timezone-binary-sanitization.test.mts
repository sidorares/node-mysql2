import process from 'node:process';
import { describe, it, assert } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Binary Parser: timezone Sanitization', async () => {
  const connection = createConnection().promise();

  await it(async () => {
    process.env.TEST_ENV_VALUE = 'secure';

    await connection.execute({
      sql: 'SELECT NOW()',
      timezone: `'); process.env.TEST_ENV_VALUE = "not so much"; //`,
    });

    assert.strictEqual(
      process.env.TEST_ENV_VALUE,
      'secure',
      'Timezone sanitization failed - code injection possible'
    );
  });

  await connection.end();
});

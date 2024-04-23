import { describe, test, assert } from 'poku';
import { createConnection, describeOptions } from '../../../common.test.cjs';

const connection = createConnection().promise();

describe('Text Parser: timezone Sanitization', describeOptions);

Promise.all([
  test(async () => {
    process.env.TEST_ENV_VALUE = 'secure';
    await connection.query({
      sql: 'SELECT NOW()',
      timezone: `'); process.env.TEST_ENV_VALUE = "not so much"; //`,
    });

    assert.strictEqual(
      process.env.TEST_ENV_VALUE,
      'secure',
      'Timezone sanitization failed - code injection possible',
    );
  }),
]).then(async () => {
  await connection.end();
});

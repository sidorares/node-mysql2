import process from 'node:process';
import { describe, test, assert } from 'poku';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  createConnection,
  describeOptions,
} = require('../../../common.test.cjs');

const connection = createConnection().promise();

describe('Binary Parser: timezone Sanitization', describeOptions);

Promise.all([
  test(async () => {
    process.env.TEST_ENV_VALUE = 'secure';
    await connection.execute({
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

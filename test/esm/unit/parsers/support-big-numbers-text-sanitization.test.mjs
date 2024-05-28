import { describe, test, assert } from 'poku';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  createConnection,
  describeOptions,
} = require('../../../common.test.cjs');

const connection = createConnection().promise();

const sql = 'SELECT 9007199254740991+100 AS `total`';

describe('Text Parser: supportBigNumbers Sanitization', describeOptions);

Promise.all([
  test(async () => {
    const [results] = await connection.query({
      sql,
      supportBigNumbers: true,
    });

    assert.strictEqual(
      typeof results[0].total,
      'string',
      'Valid supportBigNumbers enabled',
    );
  }),
  test(async () => {
    const [results] = await connection.query({
      sql,
      supportBigNumbers: false,
    });

    assert.strictEqual(
      typeof results[0].total,
      'number',
      'Valid supportBigNumbers disabled',
    );
  }),

  test(async () => {
    const [results] = await connection.query({
      sql,
      supportBigNumbers: 'text',
    });

    assert.strictEqual(
      typeof results[0].total,
      'string',
      'supportBigNumbers as a random string should be enabled',
    );
  }),
  test(async () => {
    const [results] = await connection.query({
      sql,
      supportBigNumbers: '',
    });

    assert.strictEqual(
      typeof results[0].total,
      'number',
      'supportBigNumbers as an empty string should be disabled',
    );
  }),
]).then(async () => {
  await connection.end();
});

import { describe, test, assert } from 'poku';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  createConnection,
  describeOptions,
} = require('../../../common.test.cjs');

const connection = createConnection().promise();

const sql = 'SELECT 9007199254740991+100 AS `total`';

describe('Text Parser: bigNumberStrings Sanitization', describeOptions);

Promise.all([
  test(async () => {
    const [results] = await connection.query({
      sql,
      supportBigNumbers: true,
      bigNumberStrings: true,
    });

    assert.strictEqual(
      typeof results[0].total,
      'string',
      'Valid bigNumberStrings enabled',
    );
  }),
  test(async () => {
    const [results] = await connection.query({
      sql,
      supportBigNumbers: false,
      bigNumberStrings: false,
    });

    assert.strictEqual(
      typeof results[0].total,
      'number',
      'Valid bigNumberStrings disabled',
    );
  }),

  test(async () => {
    const [results] = await connection.query({
      sql,
      supportBigNumbers: 'text',
      bigNumberStrings: 'text',
    });

    assert.strictEqual(
      typeof results[0].total,
      'string',
      'bigNumberStrings as a random string should be enabled',
    );
  }),
  test(async () => {
    const [results] = await connection.query({
      sql,
      supportBigNumbers: '',
      bigNumberStrings: '',
    });

    assert.strictEqual(
      typeof results[0].total,
      'number',
      'bigNumberStrings as an empty string should be disabled',
    );
  }),
]).then(async () => {
  await connection.end();
});

import { test, describe, assert } from 'poku';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  createConnection,
  describeOptions,
} = require('../../../common.test.cjs');

describe('JSON Parser', describeOptions);

const connection = createConnection().promise();

Promise.all([
  test(async () => {
    const [result] = await connection.query(
      `SELECT CAST('{"test": true}' AS JSON) AS json_result`,
    );

    assert.deepStrictEqual(
      result[0].json_result,
      { test: true },
      'Ensure JSON return parsed (query)',
    );
  }),
  test(async () => {
    const [result] = await connection.execute(
      `SELECT CAST('{"test": true}' AS JSON) AS json_result`,
    );

    assert.deepStrictEqual(
      result[0].json_result,
      { test: true },
      'Ensure JSON return parsed (execute)',
    );
  }),
]).then(async () => {
  await connection.end();
});

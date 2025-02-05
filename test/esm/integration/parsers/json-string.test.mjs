import { test, describe, assert } from 'poku';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  createConnection,
  describeOptions,
} = require('../../../common.test.cjs');

describe('JSON String', describeOptions);

const connection = createConnection({
  jsonStrings: true,
}).promise();

Promise.all([
  test(async () => {
    const [result] = await connection.query(
      `SELECT CAST('{"test": true}' AS JSON) AS json_result`,
    );

    assert.deepStrictEqual(
      result[0].json_result,
      '{"test": true}',
      'Ensure JSON return as string (query)',
    );
  }),
  test(async () => {
    const [result] = await connection.execute(
      `SELECT CAST('{"test": true}' AS JSON) AS json_result`,
    );

    assert.deepStrictEqual(
      result[0].json_result,
      '{"test": true}',
      'Ensure JSON return as string (execute)',
    );
  }),
]).then(async () => {
  await connection.end();
});

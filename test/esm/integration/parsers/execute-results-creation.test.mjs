import { test, describe, assert } from 'poku';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  createConnection,
  describeOptions,
} = require('../../../common.test.cjs');

const connection = createConnection().promise();

describe('Execute: Results Creation', describeOptions);

Promise.all([
  test(async () => {
    const expected = [
      {
        test: 2,
      },
    ];
    const emptyObject = {};
    const proto = Object.getPrototypeOf(emptyObject);
    const privateObjectProps = Object.getOwnPropertyNames(proto);

    const [results] = await connection.execute('SELECT 1+1 AS `test`');

    assert.deepStrictEqual(results, expected, 'Ensure exact object "results"');
    assert.deepStrictEqual(
      Object.getOwnPropertyNames(results[0]),
      Object.getOwnPropertyNames(expected[0]),
      'Deep ensure exact object "results"',
    );
    assert.deepStrictEqual(
      Object.getPrototypeOf(results[0]),
      Object.getPrototypeOf({}),
      'Ensure clean properties in results items',
    );

    privateObjectProps.forEach((prop) => {
      assert(prop in results[0], `Ensure ${prop} exists`);
    });

    results[0].customProp = true;
    assert.strictEqual(
      results[0].customProp,
      true,
      'Ensure that the end-user is able to use custom props',
    );
  }),
  test(async () => {
    const [result] = await connection.execute('SET @1 = 1;');

    assert.strictEqual(
      result.constructor.name,
      'ResultSetHeader',
      'Ensure constructor name in result object',
    );
  }),
]).then(async () => {
  await connection.end();
});

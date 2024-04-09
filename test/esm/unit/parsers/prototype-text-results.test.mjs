import { test, describe, assert } from 'poku';
import { createConnection, describeOptions } from '../../../common.test.cjs';

const connection = createConnection().promise();

describe('Text Parser: Prototype Sanitization', describeOptions);

Promise.all([
  test(async () => {
    const expected = [{}];
    expected[0].test = 2;

    const [results] = await connection.query('SELECT 1+1 AS `test`');

    assert.notDeepStrictEqual(
      results,
      expected,
      `Ensure "results" doesn't contain a standard object ({})`,
    );
  }),
  test(async () => {
    const expected = [Object.create(null)];
    expected[0].test = 2;

    const [results] = await connection.query('SELECT 1+1 AS `test`');

    assert.deepStrictEqual(results, expected, 'Ensure clean object "results"');
    assert.strictEqual(
      Object.getPrototypeOf(results[0]),
      null,
      'Ensure clean properties in results items',
    );
    assert.strictEqual(
      typeof results[0].toString,
      'undefined',
      'Re-check prototypes (manually) in results columns',
    );
    assert.strictEqual(
      typeof results[0].test.toString,
      'function',
      'Ensure that the end-user is able to use prototypes',
    );
    assert.strictEqual(
      results[0].test.toString(),
      '2',
      'Ensure that the end-user is able to use prototypes (manually): toString',
    );
    assert.strictEqual(
      results[0].test.toFixed(2),
      '2.00',
      'Ensure that the end-user is able to use prototypes (manually): toFixed',
    );

    results[0].customProp = true;
    assert.strictEqual(
      results[0].customProp,
      true,
      'Ensure that the end-user is able to use custom props',
    );
  }),
  test(async () => {
    const [result] = await connection.query('SET @1 = 1;');

    assert.strictEqual(
      result.constructor.name,
      'ResultSetHeader',
      'Ensure constructor name in result object',
    );
  }),
]).then(async () => {
  await connection.end();
});

import type { ResultSetHeader, RowDataPacket } from '../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

type TestRow = RowDataPacket & { test: number; customProp?: boolean };

await describe('Query: Results Creation', async () => {
  const connection = createConnection().promise();

  await it(async () => {
    const expected = [
      {
        test: 2,
      },
    ];
    const emptyObject = {};
    const proto = Object.getPrototypeOf(emptyObject);
    const privateObjectProps: string[] = Object.getOwnPropertyNames(proto);

    const [results] = await connection.query<TestRow[]>('SELECT 1+1 AS `test`');

    assert.deepStrictEqual(results, expected, 'Ensure exact object "results"');
    assert.deepStrictEqual(
      Object.getOwnPropertyNames(results[0]),
      Object.getOwnPropertyNames(expected[0]),
      'Deep ensure exact object "results"'
    );
    assert.deepStrictEqual(
      Object.getPrototypeOf(results[0]),
      Object.getPrototypeOf({}),
      'Ensure clean properties in results items'
    );

    privateObjectProps.forEach((prop) => {
      assert(prop in results[0], `Ensure ${prop} exists`);
    });

    results[0].customProp = true;
    assert.strictEqual(
      results[0].customProp,
      true,
      'Ensure that the end-user is able to use custom props'
    );
  });

  await it(async () => {
    const [result] = await connection.query<ResultSetHeader>('SET @1 = 1;');

    assert.strictEqual(
      result.constructor.name,
      'ResultSetHeader',
      'Ensure constructor name in result object'
    );
  });

  await connection.end();
});

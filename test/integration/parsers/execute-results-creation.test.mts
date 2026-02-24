import type { ResultSetHeader, RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type TestRow = RowDataPacket & { test: number; customProp?: boolean };

await describe('Execute: Results Creation', async () => {
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

    const [results] = await connection.execute<TestRow[]>(
      'SELECT 1+1 AS `test`'
    );

    strict.deepStrictEqual(results, expected, 'Ensure exact object "results"');
    strict.deepStrictEqual(
      Object.getOwnPropertyNames(results[0]),
      Object.getOwnPropertyNames(expected[0]),
      'Deep ensure exact object "results"'
    );
    strict.deepStrictEqual(
      Object.getPrototypeOf(results[0]),
      Object.getPrototypeOf({}),
      'Ensure clean properties in results items'
    );

    privateObjectProps.forEach((prop) => {
      strict(prop in results[0], `Ensure ${prop} exists`);
    });

    results[0].customProp = true;
    strict.strictEqual(
      results[0].customProp,
      true,
      'Ensure that the end-user is able to use custom props'
    );
  });

  await it(async () => {
    const [result] = await connection.execute<ResultSetHeader>('SET @1 = 1;');

    strict.strictEqual(
      result.constructor.name,
      'ResultSetHeader',
      'Ensure constructor name in result object'
    );
  });

  await connection.end();
});

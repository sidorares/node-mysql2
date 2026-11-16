import type {
  Connection,
  QueryOptions,
  RowDataPacket,
} from '../../../promise.js';
import { describe, it, strict } from 'poku';
import { createConnection, getMysqlVersion } from '../../common.test.mjs';

type Row = RowDataPacket & { amount: unknown; document: unknown };

const methods = ['query', 'execute'] as const;

const firstRow = async (
  connection: Connection,
  method: (typeof methods)[number],
  options: QueryOptions
) => {
  const [rows] =
    method === 'query'
      ? await connection.query<Row[]>(options)
      : await connection.execute<Row[]>(options);
  return { ...rows[0] };
};

await describe('decimalNumbers and jsonStrings set on a query', async () => {
  const converting = createConnection({
    decimalNumbers: true,
    jsonStrings: true,
  }).promise();
  const defaults = createConnection().promise();
  const { isMariaDB } = await getMysqlVersion(defaults);

  const jsonExpression = isMariaDB
    ? `JSON_EXTRACT('{"a": 1}', '$')`
    : `CAST('{"a": 1}' AS JSON)`;
  const sql = `SELECT CAST(1.5 AS DECIMAL(10, 2)) AS amount, ${jsonExpression} AS document`;
  const exact = { amount: '1.50', document: { a: 1 } };
  const converted = { amount: 1.5, document: '{"a": 1}' };

  for (const method of methods) {
    await it(`${method} turns the connection's options off for one query`, async () => {
      const row = await firstRow(converting, method, {
        sql,
        decimalNumbers: false,
        jsonStrings: false,
      });

      strict.deepEqual(row, exact);
    });

    await it(`${method} on another connection keeps that connection's options`, async () => {
      const row = await firstRow(defaults, method, { sql });

      strict.deepEqual(row, exact);
    });

    await it(`${method} turns the options on for one query`, async () => {
      const row = await firstRow(defaults, method, {
        sql,
        decimalNumbers: true,
        jsonStrings: true,
      });

      strict.deepEqual(row, converted);
    });

    await it(`${method} on the converting connection keeps its options`, async () => {
      const row = await firstRow(converting, method, { sql });

      strict.deepEqual(row, converted);
    });
  }

  await converting.end();
  await defaults.end();
});

import type { RowDataPacket } from '../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

type JsonRow = RowDataPacket & { json_result: string };

await describe('JSON String', async () => {
  const connection = createConnection({
    jsonStrings: true,
  }).promise();

  await it(async () => {
    const [result] = await connection.query<JsonRow[]>(
      `SELECT CAST('{"test": true}' AS JSON) AS json_result`
    );

    assert.deepStrictEqual(
      result[0].json_result,
      '{"test": true}',
      'Ensure JSON return as string (query)'
    );
  });

  await it(async () => {
    const [result] = await connection.execute<JsonRow[]>(
      `SELECT CAST('{"test": true}' AS JSON) AS json_result`
    );

    assert.deepStrictEqual(
      result[0].json_result,
      '{"test": true}',
      'Ensure JSON return as string (execute)'
    );
  });

  await connection.end();
});

import type { RowDataPacket } from '../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

type JsonRow = RowDataPacket & { json_result: { test: boolean } };

await describe('JSON Parser', async () => {
  const connection = createConnection().promise();

  await it(async () => {
    const [result] = await connection.query<JsonRow[]>(
      `SELECT CAST('{"test": true}' AS JSON) AS json_result`
    );

    assert.deepStrictEqual(
      result[0].json_result,
      { test: true },
      'Ensure JSON return parsed (query)'
    );
  });

  await it(async () => {
    const [result] = await connection.execute<JsonRow[]>(
      `SELECT CAST('{"test": true}' AS JSON) AS json_result`
    );

    assert.deepStrictEqual(
      result[0].json_result,
      { test: true },
      'Ensure JSON return parsed (execute)'
    );
  });

  await connection.end();
});

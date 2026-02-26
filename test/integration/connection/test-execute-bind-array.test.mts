import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection, getMysqlVersion } from '../../common.test.mjs';

await describe('Execute Bind Array', async () => {
  const connection = createConnection().promise();
  const { major } = await getMysqlVersion(connection);

  await it('execute: should JSON.stringify array parameter', async () => {
    const data = [1, 'hello', true];
    const expected = major >= 8 ? JSON.stringify(data) : data;

    const [results] = await connection.execute<RowDataPacket[]>(
      'SELECT ? AS result',
      [data]
    );

    strict.deepStrictEqual(results[0].result, expected);
  });

  await it('execute: should JSON.stringify nested array parameter', async () => {
    const data = [
      [1, 'hello', true],
      [new Date('2025-01-01').toISOString(), null, 3.14],
      [{ nested: [1, 2] }, [BigInt(9007199254740991).toString()], false],
    ];
    const expected = major >= 8 ? JSON.stringify(data) : data;

    const [results] = await connection.execute<RowDataPacket[]>(
      'SELECT ? AS result',
      [data]
    );

    strict.deepStrictEqual(results[0].result, expected);
  });

  await connection.end();
});

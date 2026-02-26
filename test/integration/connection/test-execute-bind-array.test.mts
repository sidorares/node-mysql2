import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Execute Bind Array', async () => {
  const connection = createConnection().promise();

  await it('execute: should JSON.stringify array parameter', async () => {
    const data = [1, 'hello', true];

    const [results] = await connection.execute<RowDataPacket[]>(
      'SELECT ? AS result',
      [data]
    );

    strict.strictEqual(results[0].result, JSON.stringify(data));
  });

  await it('execute: should JSON.stringify nested array parameter', async () => {
    const data = [
      [1, 'hello', true],
      [new Date('2025-01-01').toISOString(), null, 3.14],
      [{ nested: [1, 2] }, [BigInt(9007199254740991).toString()], false],
    ];

    const [results] = await connection.execute<RowDataPacket[]>(
      'SELECT ? AS result',
      [data]
    );

    strict.strictEqual(results[0].result, JSON.stringify(data));
  });

  await connection.end();
});

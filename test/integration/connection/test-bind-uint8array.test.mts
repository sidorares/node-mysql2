import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Bind Uint8Array', async () => {
  const connection = createConnection().promise();

  await it('execute: should accept Uint8Array as Buffer-like parameter', async () => {
    const data = new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]);

    const [results] = await connection.execute<RowDataPacket[]>(
      'SELECT ? AS result',
      [data]
    );

    strict.deepEqual(Buffer.from(results[0].result), Buffer.from(data));
  });

  await it('query: should accept Uint8Array as Buffer-like parameter', async () => {
    const data = new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]);

    const [results] = await connection.query<RowDataPacket[]>(
      'SELECT ? AS result',
      [data]
    );

    strict.deepEqual(Buffer.from(results[0].result), Buffer.from(data));
  });

  await connection.end();
});

import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

class FakeView implements ArrayBufferView {
  buffer = new ArrayBuffer(8);
  byteLength = 8;
  byteOffset = 0;
  length = 4e8;
}

await describe('Bind unsupported object', async () => {
  const connection = createConnection().promise();

  await it('execute: rejects an object shaped like an ArrayBufferView', async () => {
    await strict.rejects(
      connection.execute('SELECT ? AS result', [new FakeView()]),
      {
        name: 'TypeError',
        message:
          'Bind parameters must be null, a number, boolean, bigint, string, Date, Buffer, ArrayBuffer, TypedArray, DataView, plain object, array, or an object with toJSON(); received FakeView',
      }
    );
  });

  await it('execute: keeps the connection usable', async () => {
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT ? AS result',
      ['ok']
    );

    strict.strictEqual(rows[0].result, 'ok');
  });

  await connection.end();
});

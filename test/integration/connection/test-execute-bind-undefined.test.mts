import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Bind Undefined', async () => {
  const connection = createConnection().promise();

  await it('execute: should throw TypeError for undefined parameter', async () => {
    await strict.rejects(
      // @ts-expect-error: testing that undefined bind parameter throws TypeError
      connection.execute('SELECT ? AS result', [undefined]),
      {
        name: 'TypeError',
        message:
          'Bind parameters must not contain undefined. To pass SQL NULL specify JS null',
      }
    );
  });

  await it('query: should accept undefined bind parameter as NULL', async () => {
    const [results] = await connection.query<RowDataPacket[]>(
      'SELECT ? AS result',
      [undefined]
    );

    strict.strictEqual(results[0].result, null);
  });

  await connection.end();
});

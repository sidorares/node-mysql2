import type { Raw, RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Bind Function', async () => {
  const connection = createConnection().promise();

  await it('execute: should throw TypeError for function parameter', async () => {
    await strict.rejects(
      connection.execute('SELECT ? AS result', [function () {}]),
      {
        name: 'TypeError',
        message:
          'Bind parameters must not contain function(s). To pass the body of a function as a string call .toString() first',
      }
    );
  });

  await it('query: should stringify function parameter', async () => {
    const fn = function () {};

    const [results] = await connection.query<RowDataPacket[]>(
      'SELECT ? AS result',
      [fn]
    );

    strict.strictEqual(results[0].result, fn.toString());
  });

  await it('query: should accept Raw (toSqlString) parameter', async () => {
    const value: Raw = { toSqlString: () => '1 + 1' };

    const [results] = await connection.query<RowDataPacket[]>(
      'SELECT ? AS result',
      [value]
    );

    strict.strictEqual(results[0].result, 2);
  });

  await connection.end();
});

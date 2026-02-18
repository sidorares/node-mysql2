import type { RowDataPacket } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

type TestRow = RowDataPacket & { test: number };

await describe('Execute Cached', async () => {
  const connection = createConnection();

  const q = 'select 1 + ? as test';
  const key = `undefined/undefined/undefined${q}`;

  await it('should cache prepared statements', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.execute<TestRow[]>(q, [123], (err, _rows) => {
        if (err) return reject(err);
        connection.execute<TestRow[]>(q, [124], (err, _rows1) => {
          if (err) return reject(err);
          connection.execute<TestRow[]>(q, [125], (err, _rows2) => {
            if (err) return reject(err);
            // @ts-expect-error: internal access
            assert(connection._statements.size === 1);
            // @ts-expect-error: internal access
            assert(connection._statements.get(key).query === q);
            // @ts-expect-error: internal access
            assert(connection._statements.get(key).parameters.length === 1);

            assert.deepEqual(_rows, [{ test: 124 }]);
            assert.deepEqual(_rows1, [{ test: 125 }]);
            assert.deepEqual(_rows2, [{ test: 126 }]);

            connection.end();
            resolve();
          });
        });
      });
    });
  });
});

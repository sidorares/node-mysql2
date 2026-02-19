import type { RowDataPacket } from '../../../index.js';
import assert from 'node:assert';
import { describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Connection Reset While Closing', async () => {
  const error = new Error('read ECONNRESET') as Error & {
    code?: string;
    errno?: number;
    syscall?: string;
  };
  error.code = 'ECONNRESET';
  error.errno = -54;
  error.syscall = 'read';

  // Test that we ignore a ECONNRESET error if the connection
  // is already closing, we close and then emit the error
  await it('should ignore ECONNRESET when connection is closing', async () => {
    const connection = createConnection();

    connection.on('error', (err: Error & { code?: string }) => {
      assert.notEqual(err.code, 'ECONNRESET');
    });

    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>(`select 1 as "1"`, (err, _rows) => {
        if (err) return reject(err);
        resolve(_rows);
      });
    });

    assert.equal(rows[0]['1'], 1);
    // @ts-expect-error: TODO: implement typings
    connection.close();
    // @ts-expect-error: TODO: implement typings
    connection.stream.emit('error', error);
  });
});

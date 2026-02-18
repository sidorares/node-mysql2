import type { RowDataPacket } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Null Buffer', async () => {
  const connection = createConnection();

  connection.query('CREATE TEMPORARY TABLE binary_table (stuff BINARY(16));');
  connection.query('INSERT INTO binary_table VALUES(null)');

  await it('should handle null buffer values', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        'SELECT * from binary_table',
        (err, rowsTextProtocol) => {
          if (err) return reject(err);
          connection.execute<RowDataPacket[]>(
            'SELECT * from binary_table',
            (err, rowsBinaryProtocol) => {
              if (err) return reject(err);

              assert.deepEqual(rowsTextProtocol[0], { stuff: null });
              assert.deepEqual(rowsBinaryProtocol[0], { stuff: null });

              connection.end();
              resolve();
            }
          );
        }
      );
    });
  });
});

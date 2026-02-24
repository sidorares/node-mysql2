import type { FieldPacket, RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Select 1', async () => {
  const connection = createConnection();

  await it('should query and execute SELECT 1', async () => {
    const [queryRows, queryFields] = await new Promise<
      [RowDataPacket[], FieldPacket[]]
    >((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        'SELECT 1 as result',
        (err, rows, fields) => {
          if (err) return reject(err);
          resolve([rows, fields]);
        }
      );
    });

    strict.deepEqual(queryRows, [{ result: 1 }]);
    strict.equal(queryFields[0].name, 'result');

    const [executeRows, executeFields] = await new Promise<
      [RowDataPacket[], FieldPacket[]]
    >((resolve, reject) => {
      connection.execute<RowDataPacket[]>(
        'SELECT 1 as result',
        (err, rows, fields) => {
          if (err) return reject(err);
          resolve([rows, fields]);
        }
      );
    });

    strict.deepEqual(executeRows, [{ result: 1 }]);
    strict.equal(executeFields[0].name, 'result');
  });

  connection.end();
});

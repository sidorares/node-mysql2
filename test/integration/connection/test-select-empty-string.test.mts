import type { FieldPacket, RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Select Empty String', async () => {
  const connection = createConnection();

  await it('should return empty string from SELECT', async () => {
    let rows: RowDataPacket[];
    let fields: FieldPacket[];

    await new Promise<void>((resolve, reject) => {
      connection.query<RowDataPacket[]>('SELECT ""', (err, _rows, _fields) => {
        if (err) return reject(err);
        rows = _rows;
        fields = _fields;
        resolve();
      });
    });

    strict.deepEqual(rows!, [{ [fields![0].name]: '' }]);
  });

  connection.end();
});

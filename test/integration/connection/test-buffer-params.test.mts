import type { QueryError, RowDataPacket } from '../../../index.js';
import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type BufRow = RowDataPacket & { buf: string };

await describe('Buffer Params', async () => {
  const connection = createConnection();

  await it('should handle buffer parameters in execute and query', async () => {
    let rows: BufRow[] | undefined;
    let rows1: BufRow[] | undefined;

    const buf = Buffer.from([
      0x80, 0x90, 1, 2, 3, 4, 5, 6, 7, 8, 9, 100, 100, 255, 255,
    ]);

    await new Promise<void>((resolve, reject) => {
      connection.execute<BufRow[]>(
        'SELECT HEX(?) as buf',
        [buf],
        (err: QueryError | null, _rows) => {
          if (err) return reject(err);
          rows = _rows;
        }
      );

      connection.query<BufRow[]>(
        'SELECT HEX(?) as buf',
        [buf],
        (err: QueryError | null, _rows) => {
          if (err) return reject(err);
          rows1 = _rows;
          connection.end();
          resolve();
        }
      );
    });

    strict.deepEqual(rows, [{ buf: buf.toString('hex').toUpperCase() }]);
    strict.deepEqual(rows1, [{ buf: buf.toString('hex').toUpperCase() }]);
  });
});

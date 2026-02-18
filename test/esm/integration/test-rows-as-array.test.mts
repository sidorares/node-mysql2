import type { QueryError, RowDataPacket } from '../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../common.test.mjs';

await describe('Rows As Array', async () => {
  // enabled in initial config, disable in some tets
  await it('should return rows as arrays when enabled', async () => {
    const c = createConnection({ rowsAsArray: true });

    await new Promise<void>((resolve, reject) => {
      c.query(
        'select 1+1 as a',
        (err: QueryError | null, rows: RowDataPacket[]) => {
          if (err) return reject(err);
          assert.equal(rows[0][0], 2);
        }
      );

      c.query(
        { sql: 'select 1+2 as a', rowsAsArray: false },
        (err: QueryError | null, rows: RowDataPacket[]) => {
          if (err) return reject(err);
          assert.equal(rows[0].a, 3);
        }
      );

      c.execute(
        'select 1+1 as a',
        (err: QueryError | null, rows: RowDataPacket[]) => {
          if (err) return reject(err);
          assert.equal(rows[0][0], 2);
        }
      );

      c.execute(
        { sql: 'select 1+2 as a', rowsAsArray: false },
        (err: QueryError | null, rows: RowDataPacket[]) => {
          if (err) return reject(err);
          assert.equal(rows[0].a, 3);
          c.end();
          resolve();
        }
      );
    });
  });

  // disabled in initial config, enable in some tets
  await it('should return rows as objects when disabled', async () => {
    const c1 = createConnection({ rowsAsArray: false });

    await new Promise<void>((resolve, reject) => {
      c1.query(
        'select 1+1 as a',
        (err: QueryError | null, rows: RowDataPacket[]) => {
          if (err) return reject(err);
          assert.equal(rows[0].a, 2);
        }
      );

      c1.query(
        { sql: 'select 1+2 as a', rowsAsArray: true },
        (err: QueryError | null, rows: RowDataPacket[]) => {
          if (err) return reject(err);
          assert.equal(rows[0][0], 3);
        }
      );

      c1.execute(
        'select 1+1 as a',
        (err: QueryError | null, rows: RowDataPacket[]) => {
          if (err) return reject(err);
          assert.equal(rows[0].a, 2);
        }
      );

      c1.execute(
        { sql: 'select 1+2 as a', rowsAsArray: true },
        (err: QueryError | null, rows: RowDataPacket[]) => {
          if (err) return reject(err);
          assert.equal(rows[0][0], 3);
          c1.end();
          resolve();
        }
      );
    });
  });
});

import type { QueryError, RowDataPacket } from '../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../common.test.mjs';

await describe('Rows As Array: enabled', async () => {
  const c = createConnection({ rowsAsArray: true });

  await it('should return rows as arrays when enabled', async () => {
    let queryResult!: RowDataPacket[];
    let queryOverrideResult!: RowDataPacket[];
    let executeResult!: RowDataPacket[];
    let executeOverrideResult!: RowDataPacket[];

    await new Promise<void>((resolve, reject) => {
      c.query(
        'select 1+1 as a',
        (err: QueryError | null, rows: RowDataPacket[]) => {
          if (err) return reject(err);
          queryResult = rows;
        }
      );

      c.query(
        { sql: 'select 1+2 as a', rowsAsArray: false },
        (err: QueryError | null, rows: RowDataPacket[]) => {
          if (err) return reject(err);
          queryOverrideResult = rows;
        }
      );

      c.execute(
        'select 1+1 as a',
        (err: QueryError | null, rows: RowDataPacket[]) => {
          if (err) return reject(err);
          executeResult = rows;
        }
      );

      c.execute(
        { sql: 'select 1+2 as a', rowsAsArray: false },
        (err: QueryError | null, rows: RowDataPacket[]) => {
          if (err) return reject(err);
          executeOverrideResult = rows;
          resolve();
        }
      );
    });

    strict.equal(queryResult[0][0], 2);
    strict.equal(queryOverrideResult[0].a, 3);
    strict.equal(executeResult[0][0], 2);
    strict.equal(executeOverrideResult[0].a, 3);
  });

  c.end();
});

await describe('Rows As Array: disabled', async () => {
  const c1 = createConnection({ rowsAsArray: false });

  await it('should return rows as objects when disabled', async () => {
    let queryResult!: RowDataPacket[];
    let queryOverrideResult!: RowDataPacket[];
    let executeResult!: RowDataPacket[];
    let executeOverrideResult!: RowDataPacket[];

    await new Promise<void>((resolve, reject) => {
      c1.query(
        'select 1+1 as a',
        (err: QueryError | null, rows: RowDataPacket[]) => {
          if (err) return reject(err);
          queryResult = rows;
        }
      );

      c1.query(
        { sql: 'select 1+2 as a', rowsAsArray: true },
        (err: QueryError | null, rows: RowDataPacket[]) => {
          if (err) return reject(err);
          queryOverrideResult = rows;
        }
      );

      c1.execute(
        'select 1+1 as a',
        (err: QueryError | null, rows: RowDataPacket[]) => {
          if (err) return reject(err);
          executeResult = rows;
        }
      );

      c1.execute(
        { sql: 'select 1+2 as a', rowsAsArray: true },
        (err: QueryError | null, rows: RowDataPacket[]) => {
          if (err) return reject(err);
          executeOverrideResult = rows;
          resolve();
        }
      );
    });

    strict.equal(queryResult[0].a, 2);
    strict.equal(queryOverrideResult[0][0], 3);
    strict.equal(executeResult[0].a, 2);
    strict.equal(executeOverrideResult[0][0], 3);
  });

  c1.end();
});

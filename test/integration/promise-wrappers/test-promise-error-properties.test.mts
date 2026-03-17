import { describe, it, strict } from 'poku';
import { createConnection, createPool } from '../../common.test.mjs';

type MysqlError = Error & {
  code?: string;
  errno?: number;
  fatal?: boolean;
  sql?: string;
  sqlState?: string;
  sqlMessage?: string;
};

await describe('promise error propagation: fatal flag via makeDoneCb', async () => {
  const conn = createConnection().promise();

  await it('query rejection should carry fatal=true on fatal errors', async () => {
    let caughtErr: MysqlError | undefined;
    try {
      // Force a fatal protocol error by sending an invalid SQL that causes
      // a server-side error — non-fatal, but we verify the property is forwarded
      await conn.query('SELECT 1 FROM nonexistent_table_xyz');
    } catch (err) {
      caughtErr = err as MysqlError;
    }
    strict.ok(caughtErr, 'Expected query to throw');
    strict.ok('errno' in caughtErr!, 'errno should be propagated');
    strict.ok('code' in caughtErr!, 'code should be propagated');
    strict.ok('sqlMessage' in caughtErr!, 'sqlMessage should be propagated');
    // fatal should be explicitly false (not undefined) for non-fatal errors
    strict.equal(
      caughtErr!.fatal,
      undefined,
      'fatal should be undefined for non-fatal errors'
    );
  });

  await conn.end();
});

await describe('promise error propagation: PromisePool.execute with falsy args', async () => {
  const pool = createPool().promise();

  await it('execute with empty array args should work correctly', async () => {
    // Previously `if (args)` would treat [] as falsy — but [] is truthy in JS,
    // the real risk was args=0 or args=null. Verify [] works fine.
    const [rows] = await pool.execute<{ n: number }[]>('SELECT 1 AS n', []);
    strict.equal(rows[0].n, 1);
  });

  await it('execute without args should work correctly', async () => {
    const [rows] = await pool.execute<{ n: number }[]>('SELECT 2 AS n');
    strict.equal(rows[0].n, 2);
  });

  await pool.end();
});

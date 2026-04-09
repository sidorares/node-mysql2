import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type MysqlError = Error & {
  code?: string;
  errno?: number;
  fatal?: boolean;
  sqlState?: string;
  sqlMessage?: string;
};

await describe('promise error propagation: fatal flag in connection methods', async () => {
  await it('ping rejection should carry fatal flag', async () => {
    // Connect to an invalid host so ping fails with a fatal error
    const conn = createConnection({ host: '127.0.0.1', port: 1 }).promise();

    let caughtErr: MysqlError | undefined;
    try {
      await conn.ping();
    } catch (err) {
      caughtErr = err as MysqlError;
    }

    strict.ok(caughtErr, 'Expected ping to throw');
    strict.ok('code' in caughtErr!, 'code should be propagated');
    strict.equal(
      caughtErr!.fatal,
      true,
      'fatal should be true for connection errors'
    );
  });

  await it('connect rejection should carry fatal flag', async () => {
    const conn = createConnection({ host: '127.0.0.1', port: 1 }).promise();

    let caughtErr: MysqlError | undefined;
    try {
      await conn.connect();
    } catch (err) {
      caughtErr = err as MysqlError;
    }

    strict.ok(caughtErr, 'Expected connect to throw');
    strict.ok('code' in caughtErr!, 'code should be propagated');
    strict.equal(
      caughtErr!.fatal,
      true,
      'fatal should be true for connection errors'
    );
  });
});

await describe('promise error propagation: fatal flag in prepare and changeUser', async () => {
  const conn = createConnection().promise();

  await it('prepare rejection should propagate error properties', async () => {
    let caughtErr: MysqlError | undefined;
    try {
      await conn.prepare('SELECT * FROM nonexistent_table_xyz_abc');
    } catch (err) {
      caughtErr = err as MysqlError;
    }
    strict.ok(caughtErr, 'Expected prepare to throw');
    strict.ok('errno' in caughtErr!, 'errno should be propagated');
    strict.ok('code' in caughtErr!, 'code should be propagated');
    strict.ok('sqlMessage' in caughtErr!, 'sqlMessage should be propagated');
  });

  await it('changeUser rejection should propagate error properties', async () => {
    let caughtErr: MysqlError | undefined;
    try {
      await conn.changeUser({ user: 'nonexistent_user_xyz' });
    } catch (err) {
      caughtErr = err as MysqlError;
    }
    strict.ok(caughtErr, 'Expected changeUser to throw');
    strict.ok('errno' in caughtErr!, 'errno should be propagated');
    strict.ok('code' in caughtErr!, 'code should be propagated');
  });

  await conn.end();
});

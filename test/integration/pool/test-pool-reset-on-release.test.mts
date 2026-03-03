import type {
  PoolConnection,
  QueryError,
  RowDataPacket,
} from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createPool } from '../../common.test.mjs';

await describe('Pool Reset On Release', async () => {
  await it('should reset connection when released to pool (default behavior)', async () => {
    const pool = createPool({ connectionLimit: 1 });

    // Get connection and set user variable
    const conn1 = await new Promise<PoolConnection>((resolve, reject) => {
      pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
    });

    await new Promise<void>((resolve, reject) => {
      conn1.query("SET @pool_test = 'first_user'", (err) =>
        err ? reject(err) : resolve()
      );
    });

    // Verify variable is set
    const rows1 = await new Promise<RowDataPacket[]>((resolve, reject) => {
      conn1.query<RowDataPacket[]>('SELECT @pool_test as val', (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });
    strict.equal(rows1[0].val, 'first_user');

    // Release connection back to pool
    conn1.release();

    // Wait a bit for reset to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Get same connection again (pool only has 1)
    const conn2 = await new Promise<PoolConnection>((resolve, reject) => {
      pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
    });

    // Variable should be cleared
    const rows2 = await new Promise<RowDataPacket[]>((resolve, reject) => {
      conn2.query<RowDataPacket[]>('SELECT @pool_test as val', (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });
    strict.equal(
      rows2[0].val,
      null,
      'User variable should be cleared after reset'
    );

    conn2.release();
    await pool.end();
  });

  await it('should not reset when resetOnRelease is false', async () => {
    const pool = createPool({ connectionLimit: 1, resetOnRelease: false });

    // Get connection and set user variable
    const conn1 = await new Promise<PoolConnection>((resolve, reject) => {
      pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
    });

    await new Promise<void>((resolve, reject) => {
      conn1.query("SET @pool_no_reset = 'persistent'", (err) =>
        err ? reject(err) : resolve()
      );
    });

    conn1.release();

    // Get same connection again
    const conn2 = await new Promise<PoolConnection>((resolve, reject) => {
      pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
    });

    // Variable should still be set
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      conn2.query<RowDataPacket[]>(
        'SELECT @pool_no_reset as val',
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
    strict.equal(
      rows[0].val,
      'persistent',
      'User variable should persist when resetOnRelease is false'
    );

    conn2.release();
    await pool.end();
  });

  await it('should handle reset errors gracefully', async () => {
    const pool = createPool({ connectionLimit: 2, resetOnRelease: true });

    const conn1 = await new Promise<PoolConnection>((resolve, reject) => {
      pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
    });

    // Simulate a connection that will fail reset by destroying it
    conn1.reset = function (cb?: (err: QueryError | null) => any): void {
      // Force an error
      if (cb) process.nextTick(() => cb(new Error('Reset failed') as QueryError));
    };

    // Release should handle the error
    conn1.release();

    // Wait for error handling
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Pool should still be able to create new connections
    const conn2 = await new Promise<PoolConnection>((resolve, reject) => {
      pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
    });

    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      conn2.query<RowDataPacket[]>('SELECT 1 as result', (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });
    strict.equal(rows[0].result, 1);

    conn2.release();
    await pool.end();
  });

  await it('should clear prepared statements on pool reuse', async () => {
    const pool = createPool({ connectionLimit: 1, resetOnRelease: true });

    // Get connection and execute prepared statement
    const conn1 = await new Promise<PoolConnection>((resolve, reject) => {
      pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
    });

    await new Promise<RowDataPacket[]>((resolve, reject) => {
      conn1.execute<RowDataPacket[]>('SELECT ? as value', [100], (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });

    const stmtsBefore = (conn1 as unknown as { _statements?: { size: number } })
      ._statements
      ? (conn1 as unknown as { _statements: { size: number } })._statements.size
      : 0;
    strict.ok(stmtsBefore > 0, 'Should have cached statements');

    conn1.release();

    // Wait for reset
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Get same connection
    const conn2 = await new Promise<PoolConnection>((resolve, reject) => {
      pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
    });

    const stmtsAfter = (conn2 as unknown as { _statements?: { size: number } })
      ._statements
      ? (conn2 as unknown as { _statements: { size: number } })._statements.size
      : 0;
    strict.equal(stmtsAfter, 0, 'Statement cache should be cleared');

    // New statements should work fine
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      conn2.execute<RowDataPacket[]>('SELECT ? as value', [200], (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });
    strict.equal(rows[0].value, 200);

    conn2.release();
    await pool.end();
  });

  await it('should work with promise pool', async () => {
    const mysql = await import('../../../promise.js');
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'test',
      connectionLimit: 1,
      resetOnRelease: true,
    });

    // First connection sets variable
    const conn1 = await pool.getConnection();
    await conn1.query("SET @promise_pool_test = 'first'");

    const [rows1] = await conn1.query<RowDataPacket[]>(
      'SELECT @promise_pool_test as val'
    );
    strict.equal(rows1[0].val, 'first');

    conn1.release();

    // Wait for reset
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Second connection should have cleared variable
    const conn2 = await pool.getConnection();
    const [rows2] = await conn2.query<RowDataPacket[]>(
      'SELECT @promise_pool_test as val'
    );
    strict.equal(rows2[0].val, null);

    conn2.release();
    await pool.end();
  });

  await it('should reset connection before giving to queued request', async () => {
    const pool = createPool({ connectionLimit: 1, resetOnRelease: true });

    // Get the only connection
    const conn1 = await new Promise<PoolConnection>((resolve, reject) => {
      pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
    });

    // Set user variable
    await new Promise<void>((resolve, reject) => {
      conn1.query("SET @queued_test = 'value1'", (err) =>
        err ? reject(err) : resolve()
      );
    });

    // Queue a second request while first is active
    const conn2Promise = new Promise<PoolConnection>((resolve, reject) => {
      pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn)));
    });

    // Release first connection (should trigger reset then give to queued request)
    conn1.release();

    // Wait for queued connection
    const conn2 = await conn2Promise;

    // Give reset time to complete before queued request gets connection
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Variable should be cleared
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      conn2.query<RowDataPacket[]>('SELECT @queued_test as val', (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });
    strict.equal(rows[0].val, null);

    conn2.release();
    await pool.end();
  });
});

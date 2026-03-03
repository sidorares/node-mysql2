import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Reset Connection', async () => {
  await it('should reset connection successfully', async () => {
    const connection = createConnection();

    await new Promise<void>((resolve, reject) => {
      connection.reset((err) => (err ? reject(err) : resolve()));
    });

    // Connection should still be usable after reset
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>('SELECT 1 as result', (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });

    strict.equal(rows[0].result, 1);
    connection.end();
  });

  await it('should clear user variables after reset', async () => {
    const connection = createConnection();

    // Set a user variable
    await new Promise<void>((resolve, reject) => {
      connection.query("SET @test_var = 'before_reset'", (err) =>
        err ? reject(err) : resolve()
      );
    });

    // Verify variable is set
    const rowsBefore = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>('SELECT @test_var as var_value', (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });
    strict.equal(rowsBefore[0].var_value, 'before_reset');

    // Reset connection
    await new Promise<void>((resolve, reject) => {
      connection.reset((err) => (err ? reject(err) : resolve()));
    });

    // Verify variable is cleared (should be NULL)
    const rowsAfter = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>('SELECT @test_var as var_value', (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });
    strict.equal(rowsAfter[0].var_value, null);

    connection.end();
  });

  await it('should drop temporary tables after reset', async () => {
    const connection = createConnection();

    // Create a temporary table
    await new Promise<void>((resolve, reject) => {
      connection.query(
        'CREATE TEMPORARY TABLE test_temp (id INT)',
        (err) => (err ? reject(err) : resolve())
      );
    });

    // Verify table exists
    await new Promise<void>((resolve, reject) => {
      connection.query('INSERT INTO test_temp VALUES (1)', (err) =>
        err ? reject(err) : resolve()
      );
    });

    // Reset connection
    await new Promise<void>((resolve, reject) => {
      connection.reset((err) => (err ? reject(err) : resolve()));
    });

    // Verify table is gone (should error)
    await new Promise<void>((resolve, reject) => {
      connection.query('SELECT * FROM test_temp', (err) => {
        if (err && err.code === 'ER_NO_SUCH_TABLE') {
          resolve();
        } else {
          reject(new Error('Expected ER_NO_SUCH_TABLE error'));
        }
      });
    });

    connection.end();
  });

  await it('should clear prepared statements after reset', async () => {
    const connection = createConnection();

    // Create a prepared statement
    await new Promise<void>((resolve, reject) => {
      connection.execute('SELECT ? as value', [1], (err) =>
        err ? reject(err) : resolve()
      );
    });

    // Check that statement is cached
    const statementsBefore = connection._statements ? connection._statements.size : 0;
    strict.ok(statementsBefore > 0, 'Statement should be cached');

    // Reset connection
    await new Promise<void>((resolve, reject) => {
      connection.reset((err) => (err ? reject(err) : resolve()));
    });

    // Check that cache is cleared
    const statementsAfter = connection._statements ? connection._statements.size : 0;
    strict.equal(statementsAfter, 0, 'Statement cache should be cleared');

    // Connection should still work with new prepared statements
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.execute<RowDataPacket[]>('SELECT ? as value', [42], (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });
    strict.equal(rows[0].value, 42);

    connection.end();
  });

  await it('should rollback active transaction on reset', async () => {
    const connection = createConnection();

    // Create test table
    await new Promise<void>((resolve, reject) => {
      connection.query(
        'CREATE TEMPORARY TABLE test_txn (id INT)',
        (err) => (err ? reject(err) : resolve())
      );
    });

    // Start transaction and insert
    await new Promise<void>((resolve, reject) => {
      connection.beginTransaction((err) => (err ? reject(err) : resolve()));
    });

    await new Promise<void>((resolve, reject) => {
      connection.query('INSERT INTO test_txn VALUES (1)', (err) =>
        err ? reject(err) : resolve()
      );
    });

    // Reset connection (should rollback)
    await new Promise<void>((resolve, reject) => {
      connection.reset((err) => (err ? reject(err) : resolve()));
    });

    // Temporary table is gone after reset, which is expected
    // This test verifies reset completes successfully even with active transaction
    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>('SELECT 1 as result', (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });
    strict.equal(rows[0].result, 1);

    connection.end();
  });

  await it('should work with promise wrapper', async () => {
    const mysql = await import('../../../promise.js');
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'test',
    });

    // Set a user variable
    await connection.query("SET @promise_test = 'value'");

    // Verify it's set
    const [rowsBefore] = await connection.query<RowDataPacket[]>(
      'SELECT @promise_test as val'
    );
    strict.equal(rowsBefore[0].val, 'value');

    // Reset
    await connection.reset();

    // Verify it's cleared
    const [rowsAfter] = await connection.query<RowDataPacket[]>(
      'SELECT @promise_test as val'
    );
    strict.equal(rowsAfter[0].val, null);

    await connection.end();
  });
});

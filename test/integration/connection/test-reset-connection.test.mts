import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Reset Connection', async () => {
  await describe('basic reset', async () => {
    const connection = createConnection();

    await it('should reset connection successfully', async () => {
      await new Promise<void>((resolve, reject) => {
        connection.reset((err) => (err ? reject(err) : resolve()));
      });

      const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
        connection.query<RowDataPacket[]>('SELECT 1 as result', (err, rows) =>
          err ? reject(err) : resolve(rows)
        );
      });

      strict.equal(rows[0].result, 1);
    });

    connection.end();
  });

  await describe('user variables', async () => {
    const connection = createConnection();

    await it('should clear user variables after reset', async () => {
      await new Promise<void>((resolve, reject) => {
        connection.query("SET @test_var = 'before_reset'", (err) =>
          err ? reject(err) : resolve()
        );
      });

      const rowsBefore = await new Promise<RowDataPacket[]>(
        (resolve, reject) => {
          connection.query<RowDataPacket[]>(
            'SELECT @test_var as var_value',
            (err, rows) => (err ? reject(err) : resolve(rows))
          );
        }
      );
      strict.equal(rowsBefore[0].var_value, 'before_reset');

      await new Promise<void>((resolve, reject) => {
        connection.reset((err) => (err ? reject(err) : resolve()));
      });

      const rowsAfter = await new Promise<RowDataPacket[]>(
        (resolve, reject) => {
          connection.query<RowDataPacket[]>(
            'SELECT @test_var as var_value',
            (err, rows) => (err ? reject(err) : resolve(rows))
          );
        }
      );
      strict.equal(rowsAfter[0].var_value, null);
    });

    connection.end();
  });

  await describe('temporary tables', async () => {
    const connection = createConnection();

    await it('should drop temporary tables after reset', async () => {
      await new Promise<void>((resolve, reject) => {
        connection.query('CREATE TEMPORARY TABLE test_temp (id INT)', (err) =>
          err ? reject(err) : resolve()
        );
      });

      await new Promise<void>((resolve, reject) => {
        connection.query('INSERT INTO test_temp VALUES (1)', (err) =>
          err ? reject(err) : resolve()
        );
      });

      await new Promise<void>((resolve, reject) => {
        connection.reset((err) => (err ? reject(err) : resolve()));
      });

      await new Promise<void>((resolve, reject) => {
        connection.query('SELECT * FROM test_temp', (err) => {
          if (err && err.code === 'ER_NO_SUCH_TABLE') {
            resolve();
          } else {
            reject(new Error('Expected ER_NO_SUCH_TABLE error'));
          }
        });
      });
    });

    connection.end();
  });

  await describe('prepared statements', async () => {
    const connection = createConnection();

    await it('should clear prepared statements after reset', async () => {
      await new Promise<void>((resolve, reject) => {
        connection.execute('SELECT ? as value', [1], (err) =>
          err ? reject(err) : resolve()
        );
      });

      // @ts-expect-error: internal access
      const statementsBefore = connection._statements
        ? // @ts-expect-error: internal access
          connection._statements.size
        : 0;
      strict.ok(statementsBefore > 0, 'Statement should be cached');

      await new Promise<void>((resolve, reject) => {
        connection.reset((err) => (err ? reject(err) : resolve()));
      });

      // @ts-expect-error: internal access
      const statementsAfter = connection._statements
        ? // @ts-expect-error: internal access
          connection._statements.size
        : 0;
      strict.equal(statementsAfter, 0, 'Statement cache should be cleared');

      const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
        connection.execute<RowDataPacket[]>(
          'SELECT ? as value',
          [42],
          (err, rows) => (err ? reject(err) : resolve(rows))
        );
      });
      strict.equal(rows[0].value, 42);
    });

    connection.end();
  });

  await describe('active transaction', async () => {
    const connection = createConnection();

    await it('should rollback active transaction on reset', async () => {
      await new Promise<void>((resolve, reject) => {
        connection.query('CREATE TEMPORARY TABLE test_txn (id INT)', (err) =>
          err ? reject(err) : resolve()
        );
      });

      await new Promise<void>((resolve, reject) => {
        connection.beginTransaction((err) => (err ? reject(err) : resolve()));
      });

      await new Promise<void>((resolve, reject) => {
        connection.query('INSERT INTO test_txn VALUES (1)', (err) =>
          err ? reject(err) : resolve()
        );
      });

      await new Promise<void>((resolve, reject) => {
        connection.reset((err) => (err ? reject(err) : resolve()));
      });

      const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
        connection.query<RowDataPacket[]>('SELECT 1 as result', (err, rows) =>
          err ? reject(err) : resolve(rows)
        );
      });
      strict.equal(rows[0].result, 1);
    });

    connection.end();
  });

  await describe('promise wrapper', async () => {
    const mysql = await import('../../../promise.js');
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'test',
    });

    await it('should work with promise wrapper', async () => {
      await connection.query("SET @promise_test = 'value'");

      const [rowsBefore] = await connection.query<RowDataPacket[]>(
        'SELECT @promise_test as val'
      );
      strict.equal(rowsBefore[0].val, 'value');

      await connection.reset();

      const [rowsAfter] = await connection.query<RowDataPacket[]>(
        'SELECT @promise_test as val'
      );
      strict.equal(rowsAfter[0].val, null);
    });

    await connection.end();
  });
});

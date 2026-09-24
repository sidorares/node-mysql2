import type { QueryError, RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { ER_PARSE_ERROR } from '../../../lib/constants/errors.js';
import { createConnection } from '../../common.test.mjs';

type TestRow = RowDataPacket & { test: number };

await describe('Execute Cached', async () => {
  const connection = createConnection();

  const q = 'select 1 + ? as test';
  const key = `undefined/undefined/undefined${q}`;

  await it('should cache prepared statements (Callback API)', async () => {
    const rows1 = await new Promise<TestRow[]>((resolve, reject) => {
      connection.execute<TestRow[]>(q, [123], (err, _rows) =>
        err ? reject(err) : resolve(_rows)
      );
    });

    const rows2 = await new Promise<TestRow[]>((resolve, reject) => {
      connection.execute<TestRow[]>(q, [124], (err, _rows) =>
        err ? reject(err) : resolve(_rows)
      );
    });

    const rows3 = await new Promise<TestRow[]>((resolve, reject) => {
      connection.execute<TestRow[]>(q, [125], (err, _rows) =>
        err ? reject(err) : resolve(_rows)
      );
    });

    // @ts-expect-error: internal access
    strict(connection._statements.size === 1);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).query === q);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).parameters.length === 1);

    strict.deepEqual(rows1, [{ test: 124 }]);
    strict.deepEqual(rows2, [{ test: 125 }]);
    strict.deepEqual(rows3, [{ test: 126 }]);
  });

  await it('should discard cached prepared statements that no longer exist on the server and retry automatically (Callback API)', async () => {
    // Remove on the server but leave it in the cache
    // @ts-expect-error: internal access
    connection._statements.get(key).close();

    // Remember the id
    // @ts-expect-error: internal access
    const { id: oldStatementId } = connection._statements.get(key);

    // @ts-expect-error: internal access
    strict(connection._statements.size === 1);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).query === q);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).parameters.length === 1);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).id === oldStatementId);

    const rows1 = await new Promise<TestRow[]>((resolve, reject) => {
      connection.execute<TestRow[]>(q, [123], (err, _rows) =>
        err ? reject(err) : resolve(_rows)
      );
    });

    const rows2 = await new Promise<TestRow[]>((resolve, reject) => {
      connection.execute<TestRow[]>(q, [124], (err, _rows) =>
        err ? reject(err) : resolve(_rows)
      );
    });

    const rows3 = await new Promise<TestRow[]>((resolve, reject) => {
      connection.execute<TestRow[]>(q, [125], (err, _rows) =>
        err ? reject(err) : resolve(_rows)
      );
    });

    // @ts-expect-error: internal access
    strict(connection._statements.size === 1);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).query === q);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).parameters.length === 1);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).id !== oldStatementId);

    strict.deepEqual(rows1, [{ test: 124 }]);
    strict.deepEqual(rows2, [{ test: 125 }]);
    strict.deepEqual(rows3, [{ test: 126 }]);
  });

  await it('should properly forward prepare command errors to the executeCommand event listeners (Callback API)', async () => {
    // Remove on the server but leave it in the cache
    // @ts-expect-error: internal access
    connection._statements.get(key).close();

    // @ts-expect-error: internal access
    strict(connection._statements.size === 1);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).query === q);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).parameters.length === 1);

    // Intercept addCommand so we can access the prepare command instance
    let numAddCommandCalls = 0;
    // @ts-expect-error: internal access
    const origAddCommand = connection.addCommand.bind(connection);
    // @ts-expect-error: internal access
    connection.addCommand = function (command: { query: string }) {
      if (++numAddCommandCalls === 3) {
        // The third command added will be the prepare command issued while retrying the query
        command.query = 'ASDF'; // Force a failure with an invalid query

        // Restore the original addCommand function to the connection
        // @ts-expect-error: internal access
        connection.addCommand = origAddCommand;
      }

      origAddCommand(command);
    };

    const error = await new Promise<QueryError>((resolve, reject) => {
      connection.execute<TestRow[]>(q, [123], (err, _rows) =>
        err ? resolve(err) : reject(_rows)
      );
    });

    // @ts-expect-error: internal access
    strict(connection._statements.size === 0);
    // @ts-expect-error: internal access
    strict(!connection._statements.has(key));

    strict(error.errno === ER_PARSE_ERROR);
  });

  await it('should cache prepared statements (EventEmitter API)', async () => {
    const rows1 = await new Promise<TestRow[]>((resolve, reject) => {
      const executeCommand = connection.execute<TestRow[]>(q, [123]);
      const _rows: TestRow[] = [];

      executeCommand.once('error', (err) => reject(err));
      executeCommand.on('result', (row: TestRow) => {
        _rows.push(row);
      });
      executeCommand.once('end', () => resolve(_rows));
    });

    const rows2 = await new Promise<TestRow[]>((resolve, reject) => {
      const executeCommand = connection.execute<TestRow[]>(q, [124]);
      const _rows: TestRow[] = [];

      executeCommand.once('error', (err) => reject(err));
      executeCommand.on('result', (row: TestRow) => {
        _rows.push(row);
      });
      executeCommand.once('end', () => resolve(_rows));
    });

    const rows3 = await new Promise<TestRow[]>((resolve, reject) => {
      const executeCommand = connection.execute<TestRow[]>(q, [125]);
      const _rows: TestRow[] = [];

      executeCommand.once('error', (err) => reject(err));
      executeCommand.on('result', (row: TestRow) => {
        _rows.push(row);
      });
      executeCommand.once('end', () => resolve(_rows));
    });

    // @ts-expect-error: internal access
    strict(connection._statements.size === 1);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).query === q);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).parameters.length === 1);

    strict.deepEqual(rows1, [{ test: 124 }]);
    strict.deepEqual(rows2, [{ test: 125 }]);
    strict.deepEqual(rows3, [{ test: 126 }]);
  });

  await it('should discard cached prepared statements that no longer exist on the server and retry automatically (EventEmitter API)', async () => {
    // Remove on the server but leave it in the cache
    // @ts-expect-error: internal access
    connection._statements.get(key).close();

    // Remember the id
    // @ts-expect-error: internal access
    const { id: oldStatementId } = connection._statements.get(key);

    // @ts-expect-error: internal access
    strict(connection._statements.size === 1);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).query === q);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).parameters.length === 1);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).id === oldStatementId);

    const rows1 = await new Promise<TestRow[]>((resolve, reject) => {
      const executeCommand = connection.execute<TestRow[]>(q, [123]);
      const _rows: TestRow[] = [];

      executeCommand.once('error', (err) => reject(err));
      executeCommand.on('result', (row: TestRow) => {
        _rows.push(row);
      });
      executeCommand.once('end', () => resolve(_rows));
    });

    const rows2 = await new Promise<TestRow[]>((resolve, reject) => {
      const executeCommand = connection.execute<TestRow[]>(q, [124]);
      const _rows: TestRow[] = [];

      executeCommand.once('error', (err) => reject(err));
      executeCommand.on('result', (row: TestRow) => {
        _rows.push(row);
      });
      executeCommand.once('end', () => resolve(_rows));
    });

    const rows3 = await new Promise<TestRow[]>((resolve, reject) => {
      const executeCommand = connection.execute<TestRow[]>(q, [125]);
      const _rows: TestRow[] = [];

      executeCommand.once('error', (err) => reject(err));
      executeCommand.on('result', (row: TestRow) => {
        _rows.push(row);
      });
      executeCommand.once('end', () => resolve(_rows));
    });

    // @ts-expect-error: internal access
    strict(connection._statements.size === 1);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).query === q);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).parameters.length === 1);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).id !== oldStatementId);

    strict.deepEqual(rows1, [{ test: 124 }]);
    strict.deepEqual(rows2, [{ test: 125 }]);
    strict.deepEqual(rows3, [{ test: 126 }]);
  });

  await it('should properly forward prepare command errors to the executeCommand event listeners (EventEmitter API)', async () => {
    // Remove on the server but leave it in the cache
    // @ts-expect-error: internal access
    connection._statements.get(key).close();

    // @ts-expect-error: internal access
    strict(connection._statements.size === 1);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).query === q);
    // @ts-expect-error: internal access
    strict(connection._statements.get(key).parameters.length === 1);

    // Intercept addCommand so we can access the prepare command instance
    let numAddCommandCalls = 0;
    // @ts-expect-error: internal access
    const origAddCommand = connection.addCommand.bind(connection);
    // @ts-expect-error: internal access
    connection.addCommand = function (command: { query: string }) {
      if (++numAddCommandCalls === 3) {
        // The third command added will be the prepare command issued while retrying the query
        command.query = 'ASDF'; // Force a failure with an invalid query

        // Restore the original addCommand function to the connection
        // @ts-expect-error: internal access
        connection.addCommand = origAddCommand;
      }

      origAddCommand(command);
    };

    const errors = await new Promise<QueryError[]>((resolve, reject) => {
      const executeCommand = connection.execute<TestRow[]>(q, [123]);

      const errors: QueryError[] = [];
      executeCommand.on('error', (err) => errors.push(err));
      executeCommand.once('result', (row) => reject(row));
      executeCommand.once('end', () => resolve(errors));
    });

    // @ts-expect-error: internal access
    strict(connection._statements.size === 0);
    // @ts-expect-error: internal access
    strict(!connection._statements.has(key));

    strict(errors.length === 1);
    strict(errors[0].errno === ER_PARSE_ERROR);
  });

  connection.end();
});

import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type TestRow = RowDataPacket & { test: number };

await describe('Execute Cached', async () => {
  const connection = createConnection();

  const q = 'select 1 + ? as test';
  const key = `undefined/undefined/undefined${q}`;

  await it('should cache prepared statements', async () => {
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

    // Callback API
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

    // EventEmitter API
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

  connection.end();
});

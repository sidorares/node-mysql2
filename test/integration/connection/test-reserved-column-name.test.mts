import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

const message =
  "The field name (__proto__) can't be the same as an object's private property.";

const rowsSql = 'SELECT 1 AS `__proto__` UNION ALL SELECT 2 UNION ALL SELECT 3';

for (const disableEval of [false, true]) {
  await describe(`Reserved column name (disableEval: ${disableEval})`, async () => {
    await it('query rejects and the connection stays usable', async () => {
      const connection = createConnection({
        disableEval,
        multipleStatements: true,
      });
      const fatal: Error[] = [];
      connection.on('error', (err) => fatal.push(err));

      const run = (sql: string) =>
        new Promise<{ err: Error | null; rows?: RowDataPacket[] }>(
          (resolve) => {
            connection.query<RowDataPacket[]>(sql, (err, rows) =>
              resolve({ err, rows })
            );
          }
        );

      for (const sql of [
        rowsSql,
        'SELECT 1 AS `__proto__`; SELECT 2 AS ok',
        'SELECT 2 AS ok; SELECT 1 AS `__proto__`',
      ]) {
        const first = await run(sql);
        strict.equal(first.err?.message, message, sql);

        const second = await run('SELECT 2 AS ok');
        strict.equal(second.err, null);
        strict.deepEqual(second.rows, [{ ok: 2 }]);
      }

      strict.deepEqual(fatal, []);
      connection.end();
    });

    await it('execute rejects and the connection stays usable', async () => {
      const connection = createConnection({ disableEval });
      const fatal: Error[] = [];
      connection.on('error', (err) => fatal.push(err));

      const first = await new Promise<Error | null>((resolve) => {
        connection.execute(rowsSql, (err) => resolve(err));
      });
      strict.equal(first?.message, message);

      const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
        connection.execute<RowDataPacket[]>('SELECT 2 AS ok', (err, result) =>
          err ? reject(err) : resolve(result)
        );
      });
      strict.deepEqual(rows, [{ ok: 2 }]);

      strict.deepEqual(fatal, []);
      connection.end();
    });
  });
}

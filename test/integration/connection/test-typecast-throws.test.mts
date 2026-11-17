import type { RowDataPacket, TypeCastField } from '../../../promise.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type Row = RowDataPacket & { n: number };

const failure = new Error('typeCast failed');

const typeCast = (_field: TypeCastField, next: () => unknown) => {
  const value = next();
  if (Number(value) === 2) {
    throw failure;
  }
  return value;
};

const sql = 'SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3';

await describe('a typeCast that throws fails its command and keeps the connection', async () => {
  const connection = createConnection({ multipleStatements: true }).promise();

  for (const method of ['query', 'execute'] as const) {
    await it(`${method} rejects, then the next command runs`, async () => {
      await strict.rejects(
        method === 'query'
          ? connection.query({ sql, typeCast })
          : connection.execute({ sql, typeCast }),
        failure
      );

      const [rows] =
        method === 'query'
          ? await connection.query<Row[]>('SELECT 4 AS n')
          : await connection.execute<Row[]>('SELECT 4 AS n');

      strict.equal(rows[0].n, 4);
    });
  }

  await it('query reads past the result sets after the failing one', async () => {
    await strict.rejects(
      connection.query({ sql: `${sql}; SELECT 5 AS n; DO 1`, typeCast }),
      failure
    );

    const [rows] = await connection.query<Row[]>('SELECT 6 AS n');

    strict.equal(rows[0].n, 6);
  });

  await connection.end();
});

await describe('a typeCast that throws reports nothing more from the response', async () => {
  const connection = createConnection({ multipleStatements: true });
  const promiseConnection = connection.promise();
  const procedure = 'typecast_throws_two_result_sets';
  const afterFailure = `${sql}; DO 1; SELECT 8 AS n`;

  await promiseConnection.query(`DROP PROCEDURE IF EXISTS ${procedure}`);
  await promiseConnection.query(
    `CREATE PROCEDURE ${procedure}() BEGIN ${sql}; SELECT 8 AS n; END`
  );

  const eventsOf = (command: ReturnType<typeof connection.query>) =>
    new Promise<string[]>((resolve) => {
      const events: string[] = [];
      command
        .on('fields', () => events.push('fields'))
        .on('result', () => events.push('result'))
        .on('error', () => events.push('error'))
        .on('end', () => resolve([...events, 'end']));
    });

  await it('query emits nothing after the failure but a single error', async () => {
    strict.deepEqual(
      await eventsOf(connection.query({ sql: afterFailure, typeCast })),
      ['fields', 'result', 'error', 'end']
    );
  });

  await it('execute emits nothing after the failure but a single error', async () => {
    strict.deepEqual(
      await eventsOf(
        connection.execute({ sql: `CALL ${procedure}()`, typeCast })
      ),
      ['fields', 'result', 'error', 'end']
    );
  });

  await it('a stream reports no further result set after the failure', async () => {
    const stream = connection.query({ sql: afterFailure, typeCast }).stream();
    let fieldSets = 0;
    stream.on('fields', () => fieldSets++);

    await strict.rejects(async () => {
      for await (const row of stream) {
        strict.ok(row);
      }
    }, failure);

    strict.equal(fieldSets, 1);
  });

  await promiseConnection.query(`DROP PROCEDURE IF EXISTS ${procedure}`);
  await promiseConnection.end();
});

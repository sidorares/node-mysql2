import type { Connection, RowDataPacket, TypeCast } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

const threeRows = 'SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3';

const failOnEveryRow: TypeCast = () => {
  throw new Error('typeCast failed');
};

const failOnSecondRow: TypeCast = (field) => {
  const value = field.string();
  if (value === '2') {
    throw new Error('typeCast failed');
  }
  return value;
};

const failOnColumnN: TypeCast = (field, next) => {
  if (field.name === 'n') {
    throw new Error('typeCast failed');
  }
  return next();
};

const isStillUsable = async (connection: Connection) => {
  const [rows] = await connection
    .promise()
    .query<RowDataPacket[]>('SELECT 1 AS ok');
  return rows[0].ok === 1;
};

await describe('Row parse error', async () => {
  const connection = createConnection();
  const promiseConnection = connection.promise();
  const connectionErrors: Error[] = [];

  connection.on('error', (err) => connectionErrors.push(err));

  await it('query rejects and keeps the connection usable', async () => {
    await strict.rejects(
      promiseConnection.query({ sql: threeRows, typeCast: failOnEveryRow }),
      /typeCast failed/
    );
    strict.equal(await isStillUsable(connection), true);
  });

  await it('execute rejects and keeps the connection usable', async () => {
    await strict.rejects(
      promiseConnection.execute({ sql: threeRows, typeCast: failOnEveryRow }),
      /typeCast failed/
    );
    strict.equal(await isStillUsable(connection), true);
  });

  await it('a failure on a later row discards the rest of the result set', async () => {
    await strict.rejects(
      promiseConnection.query({ sql: threeRows, typeCast: failOnSecondRow }),
      /typeCast failed/
    );
    strict.equal(await isStillUsable(connection), true);
  });

  await it('a stream fails with the parse error', async () => {
    const stream = connection
      .query({ sql: threeRows, typeCast: failOnSecondRow })
      .stream();

    await strict.rejects(async () => {
      for await (const row of stream) {
        strict.ok(row);
      }
    }, /typeCast failed/);

    strict.equal(await isStillUsable(connection), true);
  });

  await it('clears the query timeout', async () => {
    const pendingTimeout = await new Promise((resolve) => {
      const query = connection.query(
        { sql: threeRows, typeCast: failOnEveryRow, timeout: 60000 },
        // @ts-expect-error: internal access
        () => resolve(query.queryTimeout)
      );
    });

    strict.equal(pendingTimeout, null);
  });

  it('the connection reports no protocol error', () => {
    strict.deepEqual(connectionErrors, []);
  });

  await promiseConnection.end();
});

await describe('Row parse error with multiple statements', async () => {
  const connection = createConnection({ multipleStatements: true });
  const promiseConnection = connection.promise();
  const connectionErrors: Error[] = [];

  connection.on('error', (err) => connectionErrors.push(err));

  await it('consumes the result sets that follow the failing one', async () => {
    await strict.rejects(
      promiseConnection.query({
        sql: `${threeRows}; SELECT 'second' AS s; SELECT 'third' AS t`,
        typeCast: failOnColumnN,
      }),
      /typeCast failed/
    );
    strict.equal(await isStillUsable(connection), true);
  });

  await it('emits nothing after the failure but a single error', async () => {
    const events: string[] = [];

    await new Promise<void>((resolve) => {
      connection
        .query({
          sql: `${threeRows}; SET @row_parse_error = 1; SELECT 'third' AS t`,
          typeCast: failOnSecondRow,
        })
        .on('fields', () => events.push('fields'))
        .on('result', () => events.push('result'))
        .on('error', () => events.push('error'))
        .on('end', () => {
          events.push('end');
          resolve();
        });
    });

    strict.deepEqual(events, ['fields', 'result', 'error', 'end']);
    strict.equal(await isStillUsable(connection), true);
  });

  await it('stays usable when a later statement fails on the server', async () => {
    await strict.rejects(
      promiseConnection.query({
        sql: `${threeRows}; SELECT * FROM row_parse_error_missing_table`,
        typeCast: failOnColumnN,
      })
    );
    strict.equal(await isStillUsable(connection), true);
  });

  it('the connection reports no protocol error', () => {
    strict.deepEqual(connectionErrors, []);
  });

  await promiseConnection.end();
});

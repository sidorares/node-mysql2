import type {
  Connection,
  Pool,
  PoolConnection,
  QueryError,
} from '../../../index.js';
import type { PoolConnection as PromisePoolConnection } from '../../../promise.js';
import { describe, it, skip, strict } from 'poku';
import mysql from '../../../index.js';
import { createServer } from '../../common.test.mjs';

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

type ServerError = { code: number; message: string };

type Outcome = {
  failure: QueryError | undefined;
  connectionsOpened: number;
};

const WRITE = 'INSERT INTO t VALUES (1)';

const readOnlyErrors: ServerError[] = [
  {
    code: 1290,
    message:
      'The MySQL server is running with the --read-only option so it cannot execute this statement',
  },
  {
    code: 1792,
    message: 'Cannot execute statement in a READ ONLY transaction',
  },
  {
    code: 1836,
    message: 'Running in read-only mode',
  },
];

const [readOnlyError] = readOnlyErrors;

const duplicateEntryError: ServerError = {
  code: 1062,
  message: "Duplicate entry '1' for key 'PRIMARY'",
};

const rejectionOf = (operation: Promise<unknown>) =>
  operation.then(
    () => undefined,
    (error: QueryError) => error
  );

const run = async (
  serverError: ServerError,
  scenario: (pool: Pool) => Promise<QueryError | undefined>
): Promise<Outcome> => {
  let connectionsOpened = 0;

  const server = await new Promise<ReturnType<typeof createServer>>(
    (resolve) => {
      const listening = createServer(
        () => resolve(listening),
        (conn: Connection) => {
          connectionsOpened++;

          const reply = (sql: string) => {
            if (sql.startsWith('INSERT')) {
              conn.writeError(serverError);
            } else {
              conn.writeOk();
            }
          };

          conn.on('query', reply);
          conn.on('stmt_prepare', reply);
        }
      );
    }
  );

  const pool = mysql.createPool({
    host: 'localhost',
    // @ts-expect-error: internal access
    port: server._port,
    user: 'test',
    database: 'test',
    connectionLimit: 1,
  });

  const failure = await scenario(pool);

  await pool.promise().query('SELECT 1');
  await pool.promise().end();
  // @ts-expect-error: internal access
  await new Promise((resolve) => server._server.close(resolve));

  return { failure, connectionsOpened };
};

const failOn = async (
  pool: Pool,
  write: (connection: PromisePoolConnection) => Promise<unknown>
) => {
  const connection = await pool.promise().getConnection();
  const failure = await rejectionOf(write(connection));

  connection.release();

  return failure;
};

const failInCallback = (
  pool: Pool,
  release: (connection: PoolConnection) => void
) =>
  new Promise<QueryError | undefined>((resolve) => {
    pool.getConnection((_, connection) => {
      connection.query(WRITE, (error) => {
        release(connection);
        resolve(error ?? undefined);
      });
    });
  });

await describe('Read-only errors on connections taken from the pool', async () => {
  for (const error of readOnlyErrors) {
    await it(`should discard the connection when connection.query() fails with ${error.code}`, async () => {
      const outcome = await run(error, (pool) =>
        failOn(pool, (connection) => connection.query(WRITE))
      );

      strict.equal(outcome.failure?.errno, error.code);
      strict.equal(outcome.connectionsOpened, 2);
    });

    await it(`should discard the connection when connection.execute() fails with ${error.code}`, async () => {
      const outcome = await run(error, (pool) =>
        failOn(pool, (connection) => connection.execute(WRITE))
      );

      strict.equal(outcome.failure?.errno, error.code);
      strict.equal(outcome.connectionsOpened, 2);
    });
  }

  await it('should discard the connection when it is released from the query callback', async () => {
    const outcome = await run(readOnlyError, (pool) =>
      failInCallback(pool, (connection) => connection.release())
    );

    strict.equal(outcome.failure?.errno, readOnlyError.code);
    strict.equal(outcome.connectionsOpened, 2);
  });

  await it('should discard the connection when pool.releaseConnection() returns it', async () => {
    const outcome = await run(readOnlyError, (pool) =>
      failInCallback(pool, (connection) => pool.releaseConnection(connection))
    );

    strict.equal(outcome.failure?.errno, readOnlyError.code);
    strict.equal(outcome.connectionsOpened, 2);
  });

  await it('should discard the connection when a streamed query fails', async () => {
    const outcome = await run(
      readOnlyError,
      (pool) =>
        new Promise((resolve) => {
          pool.getConnection((_, connection) => {
            connection.query(WRITE).on('error', (error) => {
              connection.release();
              resolve(error);
            });
          });
        })
    );

    strict.equal(outcome.failure?.errno, readOnlyError.code);
    strict.equal(outcome.connectionsOpened, 2);
  });

  await it('should roll back on the connection before discarding it', async () => {
    let rollbackFailure: QueryError | undefined;

    const outcome = await run(readOnlyError, async (pool) => {
      const connection = await pool.promise().getConnection();

      await connection.beginTransaction();

      const failure = await rejectionOf(connection.query(WRITE));

      rollbackFailure = await rejectionOf(connection.rollback());
      connection.release();

      return failure;
    });

    strict.equal(outcome.failure?.errno, readOnlyError.code);
    strict.equal(rollbackFailure, undefined);
    strict.equal(outcome.connectionsOpened, 2);
  });

  await it('should open a new connection for a caller waiting in the queue', async () => {
    const outcome = await run(readOnlyError, async (pool) => {
      const connection = await pool.promise().getConnection();
      const waiting = pool.promise().getConnection();
      const failure = await rejectionOf(connection.query(WRITE));

      connection.release();
      (await waiting).release();

      return failure;
    });

    strict.equal(outcome.failure?.errno, readOnlyError.code);
    strict.equal(outcome.connectionsOpened, 2);
  });

  await it('should return the connection to the pool after any other error', async () => {
    const outcome = await run(duplicateEntryError, (pool) =>
      failOn(pool, (connection) => connection.query(WRITE))
    );

    strict.equal(outcome.failure?.errno, duplicateEntryError.code);
    strict.equal(outcome.connectionsOpened, 1);
  });
});

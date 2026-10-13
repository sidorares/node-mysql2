import type { Readable } from 'node:stream';
import type { Connection, QueryError, RowDataPacket } from '../../../index.js';
import { describe, it, skip, strict } from 'poku';
import { createConnection, createServer } from '../../common.test.mjs';

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

const column = {
  catalog: 'def',
  schema: '',
  table: '',
  orgTable: '',
  name: 'n',
  orgName: '',
  characterSet: 63,
  columnLength: 1,
  columnType: 8,
  flags: 129,
  decimals: 0,
};

const streamError = (stream: Readable) =>
  new Promise<QueryError | undefined>((resolve) => {
    let error: QueryError | undefined;
    stream.on('error', (err: QueryError) => {
      error = err;
    });
    stream.on('close', () => resolve(error));
  });

const consumeAfterConnectionLoss = (respond: (conn: Connection) => void) =>
  new Promise<{ rows: RowDataPacket[]; error: QueryError | undefined }>(
    (resolve) => {
      const server = createServer(
        async () => {
          const connection: Connection = createConnection({
            // the mock server runs on this host, not on MYSQL_HOST
            host: 'localhost',
            // @ts-expect-error: internal access
            port: server._port,
            // @ts-expect-error: TODO: implement typings
            ssl: false,
          });
          connection.on('error', () => {});

          const rows: RowDataPacket[] = [];
          const buffered = connection
            .query('buffered')
            .stream({ highWaterMark: 1 });

          // @ts-expect-error: internal access
          connection.stream.once('close', () => {
            buffered.on('data', (row: RowDataPacket) => rows.push(row));
          });

          const error = await streamError(buffered);

          // @ts-expect-error: TODO: implement typings
          server.close();
          resolve({ rows, error });
        },
        (conn) => {
          conn.on('query', () => {
            // one chunk, so the response is already buffered while the stream is paused
            // @ts-expect-error: internal access
            conn.stream.cork();
            respond(conn);
            // @ts-expect-error: internal access
            conn.stream.uncork();
            // @ts-expect-error: internal access
            conn.stream.end();
          });
        }
      );
    }
  );

await describe('Query streams when the connection is lost mid-stream', async () => {
  let activeError: QueryError | undefined;
  let queuedError: QueryError | undefined;

  await new Promise<void>((resolve) => {
    const server = createServer(
      async () => {
        const connection: Connection = createConnection({
          // the mock server runs on this host, not on MYSQL_HOST
          host: 'localhost',
          // @ts-expect-error: internal access
          port: server._port,
          // @ts-expect-error: TODO: implement typings
          ssl: false,
        });
        connection.on('error', () => {});

        const active = connection.query('active').stream();
        const queued = connection.query('queued').stream();

        [activeError, queuedError] = await Promise.all([
          streamError(active),
          streamError(queued),
        ]);

        // @ts-expect-error: TODO: implement typings
        server.close();
        resolve();
      },
      (conn) => {
        conn.on('query', () => {
          // @ts-expect-error: TODO: implement typings
          conn.writeColumns([column]);
          // @ts-expect-error: TODO: implement typings
          conn.writeTextRow(['1']);
          // @ts-expect-error: internal access
          conn.stream.destroy();
        });
      }
    );
  });

  it('should error the active stream', () => {
    strict.equal(activeError?.fatal, true);
    strict.equal(activeError?.code, 'PROTOCOL_CONNECTION_LOST');
  });

  it('should error the queued stream', () => {
    strict.equal(queuedError?.fatal, true);
    strict.equal(queuedError?.code, 'PROTOCOL_CONNECTION_LOST');
  });
});

await describe('Execute without callback when the connection is lost during prepare', async () => {
  const errors: QueryError[] = [];

  await new Promise<void>((resolve) => {
    const server = createServer(
      () => {
        const connection: Connection = createConnection({
          // the mock server runs on this host, not on MYSQL_HOST
          host: 'localhost',
          // @ts-expect-error: internal access
          port: server._port,
          // @ts-expect-error: TODO: implement typings
          ssl: false,
        });

        connection.execute('prepared').on('error', (err: QueryError) => {
          errors.push(err);
        });

        connection.on('error', () => {
          // @ts-expect-error: TODO: implement typings
          server.close();
          resolve();
        });
      },
      (conn) => {
        conn.on('stmt_prepare', () => {
          // @ts-expect-error: internal access
          conn.stream.destroy();
        });
      }
    );
  });

  it('should emit the error once', () => {
    strict.equal(errors.length, 1);
    strict.equal(errors[0].code, 'PROTOCOL_CONNECTION_LOST');
  });
});

await describe('Execute with callback when the connection is lost during prepare', async () => {
  const errors: QueryError[] = [];

  await new Promise<void>((resolve) => {
    const server = createServer(
      () => {
        const connection: Connection = createConnection({
          // the mock server runs on this host, not on MYSQL_HOST
          host: 'localhost',
          // @ts-expect-error: internal access
          port: server._port,
          // @ts-expect-error: TODO: implement typings
          ssl: false,
        });
        connection.on('error', () => {});

        connection.execute('prepared', (err) => {
          if (err) errors.push(err);
        });

        // @ts-expect-error: internal access
        connection.stream.on('close', () => {
          // @ts-expect-error: TODO: implement typings
          server.close();
          resolve();
        });
      },
      (conn) => {
        conn.on('stmt_prepare', () => {
          // @ts-expect-error: internal access
          conn.stream.destroy();
        });
      }
    );
  });

  it('should call the callback once', () => {
    strict.equal(errors.length, 1);
    strict.equal(errors[0].code, 'PROTOCOL_CONNECTION_LOST');
  });
});

await describe('Query streams when the connection is lost after the whole result is buffered', async () => {
  const { rows, error } = await consumeAfterConnectionLoss((conn) => {
    conn.writeTextResult([{ n: '1' }, { n: '2' }, { n: '3' }], [column]);
  });

  it('should deliver the rows received before the connection was lost', () => {
    strict.deepEqual(rows, [{ n: 1 }, { n: 2 }, { n: 3 }]);
  });

  it('should end the stream without an error', () => {
    strict.equal(error, undefined);
  });
});

await describe('Query streams when the connection is lost after part of the result is buffered', async () => {
  const { rows, error } = await consumeAfterConnectionLoss((conn) => {
    // @ts-expect-error: TODO: implement typings
    conn.writeColumns([column]);
    for (const n of ['1', '2', '3']) {
      // @ts-expect-error: TODO: implement typings
      conn.writeTextRow([n]);
    }
  });

  it('should deliver the rows received before the connection was lost', () => {
    strict.deepEqual(rows, [{ n: 1 }, { n: 2 }, { n: 3 }]);
  });

  it('should error the stream after the buffered rows', () => {
    strict.equal(error?.fatal, true);
    strict.equal(error?.code, 'PROTOCOL_CONNECTION_LOST');
  });
});

await describe('Query streams with a timeout when the connection is lost', async () => {
  let timerAfterLoss: unknown;

  await new Promise<void>((resolve) => {
    const server = createServer(
      async () => {
        const connection: Connection = createConnection({
          // the mock server runs on this host, not on MYSQL_HOST
          host: 'localhost',
          // @ts-expect-error: internal access
          port: server._port,
          // @ts-expect-error: TODO: implement typings
          ssl: false,
        });
        connection.on('error', () => {});

        const timed = connection.query({ sql: 'timed', timeout: 60000 });
        await streamError(timed.stream());

        // @ts-expect-error: internal access
        timerAfterLoss = timed.queryTimeout;

        // @ts-expect-error: TODO: implement typings
        server.close();
        resolve();
      },
      (conn) => {
        conn.on('query', () => {
          // @ts-expect-error: internal access
          conn.stream.destroy();
        });
      }
    );
  });

  it('should clear the query timeout', () => {
    strict.equal(timerAfterLoss, null);
  });
});

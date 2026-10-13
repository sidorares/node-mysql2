import type { Readable } from 'node:stream';
import type { Connection, QueryError } from '../../../index.js';
import { describe, it, skip, strict } from 'poku';
import { createConnection, createServer } from '../../common.test.mjs';

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');

const streamError = (stream: Readable) =>
  new Promise<QueryError | undefined>((resolve) => {
    let error: QueryError | undefined;
    stream.on('error', (err: QueryError) => {
      error = err;
    });
    stream.on('close', () => resolve(error));
  });

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
          conn.writeColumns([
            {
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
            },
          ]);
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

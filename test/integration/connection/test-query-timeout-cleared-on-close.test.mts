import type { Connection, QueryError } from '../../../index.js';
import { describe, it, skip, strict } from 'poku';
import { createConnection, createServer } from '../../common.test.mjs';

if (typeof Deno !== 'undefined') skip('Deno: process is not terminated');
if (typeof Bun !== 'undefined')
  skip('Bun: net incompatibility with mock server');

const timeout = 60000;

let onQuery: (serverConnection: Connection) => void = () => {};

const server = await new Promise<ReturnType<typeof createServer>>((resolve) => {
  const mockServer = createServer(
    () => resolve(mockServer),
    (serverConnection) => {
      serverConnection.on('query', () => onQuery(serverConnection));
    }
  );
});

const connectToMockServer = () => {
  const connection = createConnection({
    host: 'localhost',
    // @ts-expect-error: internal access
    port: server._port,
    // @ts-expect-error: TODO: implement typings
    ssl: false,
  });
  connection.on('error', () => {});
  return connection;
};

await describe('query timeout when the connection is lost', async () => {
  const connection = connectToMockServer();

  let timerAfterError: unknown;

  const error = await new Promise<QueryError | null>((resolve) => {
    onQuery = (serverConnection) => {
      // @ts-expect-error: internal access
      serverConnection.stream.destroy();
    };
    const query = connection.query({ sql: 'SELECT 1', timeout }, (err) => {
      // @ts-expect-error: internal access
      timerAfterError = query.queryTimeout;
      // @ts-expect-error: internal access
      clearTimeout(query.queryTimeout);
      resolve(err);
    });
  });

  it('should fail the query with PROTOCOL_CONNECTION_LOST', () => {
    strict.equal(error?.code, 'PROTOCOL_CONNECTION_LOST');
  });

  it('should leave no timer to call the callback again', () => {
    strict.equal(timerAfterError, null);
  });

  connection.destroy();
});

await describe('query timeout when the connection is destroyed', async () => {
  const connection = connectToMockServer();

  let timerAfterDestroy: unknown;
  let callbackError: QueryError | null | undefined;
  let callbackRan = false;

  await new Promise<void>((resolve) => {
    onQuery = (serverConnection) => {
      connection.destroy();
      // @ts-expect-error: internal access
      timerAfterDestroy = query.queryTimeout;
      // @ts-expect-error: internal access
      clearTimeout(query.queryTimeout);
      serverConnection.writeOk();
    };
    const query = connection.query({ sql: 'SELECT 1', timeout }, (err) => {
      callbackRan = true;
      callbackError = err;
    });
    query.once('end', () => setImmediate(resolve));
  });

  it('should leave no timer to keep the process alive', () => {
    strict.equal(timerAfterDestroy, null);
  });

  it('should still deliver a result that arrives after destroy()', () => {
    strict.equal(callbackRan, true);
    strict.equal(callbackError, null);
  });

  connection.destroy();
});

await describe('query timeout of a query without a callback when the connection is destroyed', async () => {
  const connection = connectToMockServer();

  const queryReceived = new Promise<void>((resolve) => {
    onQuery = () => resolve();
  });

  const query = connection.query({ sql: 'SELECT 1', timeout });
  query.on('error', () => {});

  await queryReceived;

  connection.destroy();

  // @ts-expect-error: internal access
  const timerAfterDestroy: unknown = query.queryTimeout;
  // @ts-expect-error: internal access
  clearTimeout(query.queryTimeout);

  it('should keep the timer that reports the timeout', () => {
    strict.notEqual(timerAfterDestroy, null);
  });
});

await describe('execute timeout when the connection is destroyed', async () => {
  const connection = createConnection();
  connection.on('error', () => {});

  await connection.promise().execute('SELECT 1');

  const command = connection.execute({ sql: 'SELECT 1', timeout }, () => {});
  // @ts-expect-error: internal access
  const timerBeforeDestroy: unknown = command.queryTimeout;

  connection.destroy();

  // @ts-expect-error: internal access
  const timerAfterDestroy: unknown = command.queryTimeout;
  // @ts-expect-error: internal access
  clearTimeout(command.queryTimeout);

  it('should arm the timer when the command starts', () => {
    strict.notEqual(timerBeforeDestroy, null);
  });

  it('should leave no timer to keep the process alive', () => {
    strict.equal(timerAfterDestroy, null);
  });
});

await new Promise<void>((resolve) => {
  // @ts-expect-error: internal access
  server._server.close(() => resolve());
});

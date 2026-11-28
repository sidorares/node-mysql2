import { describe, it, strict } from 'poku';
import mysql from '../../../index.js';

await describe('query timer is cleared when the connection is lost', async () => {
  // @ts-expect-error: TODO: implement typings
  const server = mysql.createServer();

  let onQuery: () => void;
  const queryReceived = new Promise<void>((resolve) => {
    onQuery = resolve;
  });

  server.on('connection', (conn) => {
    conn.on('error', () => {});
    conn.serverHandshake({
      serverVersion: '8.0.42',
    });
    conn.on('query', () => {
      onQuery();
      conn.stream.destroy();
    });
  });

  const port = await new Promise<number>((resolve, reject) => {
    // @ts-expect-error: TODO: implement typings
    server.listen(0, '127.0.0.1', () => {
      // @ts-expect-error: internal access
      const address = server._server.address();
      if (address === null || typeof address === 'string') {
        return reject(new Error('unexpected server address'));
      }
      resolve(address.port);
    });
  });

  const connection = mysql.createConnection({
    host: '127.0.0.1',
    port,
    user: 'test_user',
  });
  connection.on('error', () => {});

  let calls = 0;
  let callbackError: NodeJS.ErrnoException | null = null;
  let onCallback: () => void;
  const callbackFired = new Promise<void>((resolve) => {
    onCallback = resolve;
  });

  connection.query({ sql: 'SELECT 1', timeout: 60000 }, (err) => {
    calls++;
    callbackError = err;
    onCallback();
  });

  await queryReceived;

  // @ts-expect-error: internal access
  const command = connection._command;
  strict.notEqual(command.queryTimeout, null);

  await callbackFired;

  await it('calls the callback exactly once with PROTOCOL_CONNECTION_LOST', () => {
    strict.equal(calls, 1);
    strict.ok(callbackError);
    strict.equal(callbackError?.code, 'PROTOCOL_CONNECTION_LOST');
  });

  await it('clears the query timer', () => {
    strict.equal(command.queryTimeout, null);
  });

  connection.destroy();
  // @ts-expect-error: TODO: implement typings
  server.close();
});

await describe('query timer is cleared when destroy() is called', async () => {
  // @ts-expect-error: TODO: implement typings
  const server = mysql.createServer();

  let onQuery: () => void;
  const queryReceived = new Promise<void>((resolve) => {
    onQuery = resolve;
  });

  server.on('connection', (conn) => {
    conn.on('error', () => {});
    conn.serverHandshake({
      serverVersion: '8.0.42',
    });
    conn.on('query', () => {
      onQuery();
    });
  });

  const port = await new Promise<number>((resolve, reject) => {
    // @ts-expect-error: TODO: implement typings
    server.listen(0, '127.0.0.1', () => {
      // @ts-expect-error: internal access
      const address = server._server.address();
      if (address === null || typeof address === 'string') {
        return reject(new Error('unexpected server address'));
      }
      resolve(address.port);
    });
  });

  const connection = mysql.createConnection({
    host: '127.0.0.1',
    port,
    user: 'test_user',
  });
  connection.on('error', () => {});

  let calls = 0;
  connection.query({ sql: 'SELECT 1', timeout: 60000 }, () => {
    calls++;
  });

  await queryReceived;

  // @ts-expect-error: internal access
  const command = connection._command;
  strict.notEqual(command.queryTimeout, null);

  connection.destroy();

  await it('clears the query timer', () => {
    strict.equal(command.queryTimeout, null);
  });

  await it('does not call the query callback', () => {
    strict.equal(calls, 0);
  });

  // @ts-expect-error: TODO: implement typings
  server.close();
});

await describe('callback-less timed query still reports an error when the connection is lost', async () => {
  // @ts-expect-error: TODO: implement typings
  const server = mysql.createServer();

  server.on('connection', (conn) => {
    conn.on('error', () => {});
    conn.serverHandshake({
      serverVersion: '8.0.42',
    });
    conn.on('query', () => {
      conn.stream.destroy();
    });
  });

  const port = await new Promise<number>((resolve, reject) => {
    // @ts-expect-error: TODO: implement typings
    server.listen(0, '127.0.0.1', () => {
      // @ts-expect-error: internal access
      const address = server._server.address();
      if (address === null || typeof address === 'string') {
        return reject(new Error('unexpected server address'));
      }
      resolve(address.port);
    });
  });

  const connection = mysql.createConnection({
    host: '127.0.0.1',
    port,
    user: 'test_user',
  });
  connection.on('error', () => {});

  const query = connection.query({ sql: 'SELECT 1', timeout: 50 });

  const queryError = await new Promise<NodeJS.ErrnoException>((resolve) => {
    query.on('error', (err) => {
      resolve(err);
    });
  });

  await it('emits PROTOCOL_SEQUENCE_TIMEOUT instead of hanging silently', () => {
    strict.equal(queryError.code, 'PROTOCOL_SEQUENCE_TIMEOUT');
  });

  connection.destroy();
  // @ts-expect-error: TODO: implement typings
  server.close();
});

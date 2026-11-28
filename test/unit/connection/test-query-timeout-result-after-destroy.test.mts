import { describe, it, strict } from 'poku';
import mysql from '../../../index.js';

const columns = [
  {
    catalog: 'def',
    schema: '',
    table: '',
    orgTable: '',
    name: 'a',
    orgName: '',
    characterSet: 63,
    columnLength: 11,
    columnType: 3,
    type: 3,
    flags: 129,
    decimals: 0,
  },
];

async function startRespondingServer() {
  // @ts-expect-error: TODO: implement typings
  const server = mysql.createServer();

  let onResultSent: () => void;
  const resultSent = new Promise<void>((resolve) => {
    onResultSent = resolve;
  });

  server.on('connection', (conn) => {
    conn.on('error', () => {});
    conn.serverHandshake({
      serverVersion: '8.0.42',
      characterSet: 8,
    });
    conn.on('query', () => {
      // @ts-expect-error: internal access
      conn.sequenceId = 1;
      conn.writeTextResult([{ a: 42 }], columns);
      onResultSent();
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

  return {
    port,
    resultSent,
    close: () =>
      new Promise<void>((resolve) => {
        // @ts-expect-error: internal access
        server._server.close(() => resolve());
      }),
  };
}

await describe('timed query result arriving after destroy() calls back', async () => {
  const { port, resultSent, close } = await startRespondingServer();

  const connection = mysql.createConnection({
    host: '127.0.0.1',
    port,
    user: 'test_user',
  });
  connection.on('error', () => {});

  // Wait for handshake to complete, then pause the client socket so the result
  // packet is delivered only after destroy() has cleared the query timer.
  await new Promise<void>((resolve, reject) => {
    connection.connect((err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  let calls = 0;
  let callbackError: NodeJS.ErrnoException | null = null;
  let callbackRows: unknown = null;
  const callbackSettled = new Promise<void>((resolve) => {
    connection.query({ sql: 'SELECT 42 AS a', timeout: 5000 }, (err, rows) => {
      calls++;
      callbackError = err;
      callbackRows = rows;
      resolve();
    });
  });

  connection.pause();
  await resultSent;

  // @ts-expect-error: internal access
  const command = connection._command;
  strict.notEqual(command.queryTimeout, null);

  connection.destroy();
  strict.equal(command.queryTimeout, null);

  connection.resume();
  await callbackSettled;

  await it('calls the callback exactly once with the rows', () => {
    strict.equal(calls, 1);
    strict.equal(callbackError, null);
    strict.deepEqual(callbackRows, [{ a: 42 }]);
  });

  await close();
});

await describe('timed query result arriving after destroy() resolves the promise', async () => {
  const { port, resultSent, close } = await startRespondingServer();

  const connection = mysql.createConnection({
    host: '127.0.0.1',
    port,
    user: 'test_user',
  });
  connection.on('error', () => {});

  await new Promise<void>((resolve, reject) => {
    connection.connect((err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  const queryPromise = connection
    .promise()
    .query({ sql: 'SELECT 42 AS a', timeout: 5000 });

  connection.pause();
  await resultSent;

  connection.destroy();
  connection.resume();

  const [settledRows] = await queryPromise;

  await it('resolves with the rows instead of staying pending', () => {
    strict.deepEqual(settledRows, [{ a: 42 }]);
  });

  await close();
});

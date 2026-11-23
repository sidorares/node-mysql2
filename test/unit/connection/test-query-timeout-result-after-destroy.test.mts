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

async function startGatedServer() {
  // @ts-expect-error: TODO: implement typings
  const server = mysql.createServer();

  let onQuery: () => void;
  const queryReceived = new Promise<void>((resolve) => {
    onQuery = resolve;
  });
  let onRelease: () => void;
  const releaseGate = new Promise<void>((resolve) => {
    onRelease = resolve;
  });

  server.on('connection', (conn) => {
    conn.on('error', () => {});
    conn.serverHandshake({
      serverVersion: '8.0.42',
      characterSet: 8,
    });
    conn.on('query', () => {
      onQuery();
      void releaseGate.then(() => {
        conn.writeTextResult([{ a: 42 }], columns);
      });
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
    server,
    port,
    queryReceived,
    release: () => {
      onRelease();
    },
  };
}

async function settle() {
  for (let i = 0; i < 5; i++) {
    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });
  }
  await Promise.resolve();
}

await describe('timed query result arriving after destroy() calls back', async () => {
  const { server, port, queryReceived, release } = await startGatedServer();

  const connection = mysql.createConnection({
    host: '127.0.0.1',
    port,
    user: 'test_user',
  });
  connection.on('error', () => {});

  let calls = 0;
  let callbackError: NodeJS.ErrnoException | null = null;
  let callbackRows: unknown = null;
  connection.query({ sql: 'SELECT 42 AS a', timeout: 5000 }, (err, rows) => {
    calls++;
    callbackError = err;
    callbackRows = rows;
  });

  await queryReceived;

  // @ts-expect-error: internal access
  const command = connection._command;
  strict.notEqual(command.queryTimeout, null);

  connection.destroy();
  strict.equal(command.queryTimeout, null);

  release();
  await settle();

  await it('calls the callback exactly once with the rows', () => {
    strict.equal(calls, 1);
    strict.equal(callbackError, null);
    strict.deepEqual(callbackRows, [{ a: 42 }]);
  });

  // @ts-expect-error: TODO: implement typings
  server.close();
});

await describe('timed query result arriving after destroy() resolves the promise', async () => {
  const { server, port, queryReceived, release } = await startGatedServer();

  const connection = mysql.createConnection({
    host: '127.0.0.1',
    port,
    user: 'test_user',
  });
  connection.on('error', () => {});

  let settledRows: unknown = null;
  let settledError: unknown = null;
  connection
    .promise()
    .query({ sql: 'SELECT 42 AS a', timeout: 5000 })
    .then(
      ([rows]) => {
        settledRows = rows;
      },
      (err) => {
        settledError = err;
      }
    );

  await queryReceived;

  connection.destroy();
  release();
  await settle();

  await it('resolves with the rows instead of staying pending', () => {
    strict.equal(settledError, null);
    strict.deepEqual(settledRows, [{ a: 42 }]);
  });

  // @ts-expect-error: TODO: implement typings
  server.close();
});

import assert from 'node:assert';
import process from 'node:process';
import portfinder from 'portfinder';
import mysql from '../../../../index.js';
import { createConnection } from '../../common.test.mjs';

// The process is not terminated in Deno
if (typeof Deno !== 'undefined') process.exit(0);

const connection = createConnection({ debug: false });

connection.query({ sql: 'SELECT sleep(3) as a', timeout: 500 }, (err, res) => {
  assert.equal(res, null);
  assert.ok(err);
  assert.equal(err.code, 'PROTOCOL_SEQUENCE_TIMEOUT');
  assert.equal(err.message, 'Query inactivity timeout');
});

connection.query(
  { sql: 'SELECT sleep(1) as a', timeout: 5000 },
  (_err, res) => {
    assert.deepEqual(res, [{ a: 0 }]);
  }
);

connection.query('SELECT sleep(1) as a', (_err, res) => {
  assert.deepEqual(res, [{ a: 0 }]);
});

connection.execute(
  { sql: 'SELECT sleep(3) as a', timeout: 500 },
  (err, res) => {
    assert.equal(res, null);
    assert.ok(err);
    assert.equal(err.code, 'PROTOCOL_SEQUENCE_TIMEOUT');
    assert.equal(err.message, 'Query inactivity timeout');
  }
);

connection.execute(
  { sql: 'SELECT sleep(1) as a', timeout: 5000 },
  (_err, res) => {
    assert.deepEqual(res, [{ a: 0 }]);
  }
);

connection.query(
  { sql: 'select 1 from non_existing_table', timeout: 500 },
  (err, res) => {
    assert.equal(res, null);
    assert.ok(err);
    assert.equal(err.code, 'ER_NO_SUCH_TABLE');
  }
);

connection.execute('SELECT sleep(1) as a', (_err, res) => {
  assert.deepEqual(res, [{ a: 0 }]);
  connection.end();
});

/**
 * if connect timeout
 * we should return connect timeout error instead of query timeout error
 */
portfinder.getPort((_err, port) => {
  // @ts-expect-error: TODO: implement typings
  const server = mysql.createServer();
  server.on('connection', () => {
    // Let connection time out
  });
  server.listen(port);

  const connectionTimeout = mysql.createConnection({
    host: 'localhost',
    port: port,
    connectTimeout: 1000,
  });

  // return connect timeout error first
  connectionTimeout.query(
    { sql: 'SELECT sleep(3) as a', timeout: 50 },
    (err, res) => {
      console.log('ok');
      assert.equal(res, null);
      assert.ok(err);
      assert.equal(err.code, 'ETIMEDOUT');
      assert.equal(err.message, 'connect ETIMEDOUT');
      connectionTimeout.destroy();
      // @ts-expect-error: internal access
      server._server.close();
    }
  );
});

process.on('uncaughtException', (err: NodeJS.ErrnoException) => {
  assert.equal(
    err.message,
    'Connection lost: The server closed the connection.'
  );
  assert.equal(err.code, 'PROTOCOL_CONNECTION_LOST');
});

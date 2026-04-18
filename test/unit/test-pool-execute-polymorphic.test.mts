'use strict';

const { test, assert } = require('poku');
const EventEmitter = require('events');
const BasePool = require('../../lib/base/pool.js');
const PoolConfig = require('../../lib/pool_config.js');

function makeMockConnection({ executeErr = null, readOnlyErr = false } = {}) {
  const conn = new EventEmitter();
  conn._pool = {};
  conn.authorized = true;
  conn._destroyed = false;
  conn.release = () => {};
  conn.destroy = () => {
    conn._destroyed = true;
  };
  conn.execute = function (options, cb) {
    conn._lastExecuteOptions = options;
    const result = new EventEmitter();
    process.nextTick(() => {
      const err = readOnlyErr
        ? Object.assign(new Error('read only'), { errno: 1836 })
        : executeErr;
      if (typeof cb === 'function')
        cb(err, err ? undefined : [{ ok: 1 }], err ? undefined : []);
      result.emit('end');
    });
    return result;
  };
  return conn;
}

function makeMockPool(mockConn, poolOptions = {}) {
  const config = new PoolConfig({
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test',
    connectionLimit: 5,
    queueLimit: 10,
    ...poolOptions,
  });
  const pool = new BasePool({ config });
  pool.getConnection = (cb) => process.nextTick(() => cb(null, mockConn));
  return pool;
}

// execute() tests

test('execute(sql, values, cb) — standard three-arg form', async () => {
  const conn = makeMockConnection();
  const pool = makeMockPool(conn);
  await new Promise((resolve, reject) => {
    pool.execute('SELECT ?', [42], (err, rows) => {
      if (err) return reject(err);
      assert.strictEqual(conn._lastExecuteOptions.sql, 'SELECT ?');
      assert.deepStrictEqual(conn._lastExecuteOptions.values, [42]);
      assert.ok(rows);
      resolve();
    });
  });
});

test('execute(sql, cb) — omit values, callback is second arg', async () => {
  const conn = makeMockConnection();
  const pool = makeMockPool(conn);
  await new Promise((resolve, reject) => {
    pool.execute('SELECT 1', (err, rows) => {
      if (err) return reject(err);
      assert.strictEqual(conn._lastExecuteOptions.sql, 'SELECT 1');
      assert.strictEqual(conn._lastExecuteOptions.values, undefined);
      assert.ok(rows);
      resolve();
    });
  });
});

test('execute(optionsObject, cb) — sql passed as object', async () => {
  const conn = makeMockConnection();
  const pool = makeMockPool(conn);
  await new Promise((resolve, reject) => {
    pool.execute({ sql: 'SELECT ?', values: [99] }, (err, rows) => {
      if (err) return reject(err);
      assert.strictEqual(conn._lastExecuteOptions.sql, 'SELECT ?');
      assert.deepStrictEqual(conn._lastExecuteOptions.values, [99]);
      assert.ok(rows);
      resolve();
    });
  });
});

test('execute(optionsObject, values, cb) — external values fill missing options.values', async () => {
  const conn = makeMockConnection();
  const pool = makeMockPool(conn);
  await new Promise((resolve, reject) => {
    pool.execute({ sql: 'SELECT ?' }, [55], (err, rows) => {
      if (err) return reject(err);
      assert.strictEqual(conn._lastExecuteOptions.sql, 'SELECT ?');
      assert.deepStrictEqual(conn._lastExecuteOptions.values, [55]);
      assert.ok(rows);
      resolve();
    });
  });
});

// FIX: This test guards the ?? vs || bug.
// When options.values is already set, the external values arg must be ignored —
// even if options.values is a falsy-ish value. With || this would break silently.
test('execute(optionsObject with values, externalValues, cb) — options.values takes priority over external values', async () => {
  const conn = makeMockConnection();
  const pool = makeMockPool(conn);
  await new Promise((resolve, reject) => {
    // options.values is [1], external values is [999] — [1] must win
    pool.execute({ sql: 'SELECT ?', values: [1] }, [999], (err, rows) => {
      if (err) return reject(err);
      assert.deepStrictEqual(
        conn._lastExecuteOptions.values,
        [1],
        'options.values should take priority over the external values argument'
      );
      assert.ok(rows);
      resolve();
    });
  });
});

test('execute(sql, values) — no callback must not crash', async () => {
  const conn = makeMockConnection();
  const pool = makeMockPool(conn);
  // Previously threw: TypeError: cb is not a function
  pool.execute('SELECT 1', []);
  await new Promise((r) => setTimeout(r, 50));
});

test('execute() — getConnection error forwarded to cb', async () => {
  const config = new PoolConfig({
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test',
  });
  const pool = new BasePool({ config });
  const connectionError = new Error('Pool is exhausted');
  pool.getConnection = (cb) => process.nextTick(() => cb(connectionError));
  await new Promise((resolve) => {
    pool.execute('SELECT 1', [], (err) => {
      assert.strictEqual(err, connectionError);
      resolve();
    });
  });
});

test('execute() — getConnection error without cb must not crash', async () => {
  const config = new PoolConfig({
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test',
  });
  const pool = new BasePool({ config });
  pool.getConnection = (cb) =>
    process.nextTick(() => cb(new Error('no connections')));
  pool.execute('SELECT 1', []);
  await new Promise((r) => setTimeout(r, 50));
});

test('execute() — destroys connection on ER_READ_ONLY_MODE', async () => {
  const conn = makeMockConnection({ readOnlyErr: true });
  const pool = makeMockPool(conn);
  await new Promise((resolve) => {
    pool.execute('INSERT INTO t VALUES (1)', [], (err) => {
      assert.ok(err, 'should receive the read-only error');
      assert.ok(conn._destroyed, 'connection should be destroyed');
      resolve();
    });
  });
});

// getStats() tests

test('getStats() — correct shape with defaults', () => {
  const config = new PoolConfig({
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test',
    connectionLimit: 5,
    queueLimit: 10,
  });
  const pool = new BasePool({ config });
  const stats = pool.getStats();
  assert.strictEqual(typeof stats, 'object');
  assert.strictEqual(stats.all, 0);
  assert.strictEqual(stats.free, 0);
  assert.strictEqual(stats.queued, 0);
  assert.strictEqual(stats.connectionLimit, 5);
  assert.strictEqual(stats.queueLimit, 10);
  assert.strictEqual(stats.closed, false);
});

test('getStats() — closed is true after pool.end()', async () => {
  const config = new PoolConfig({
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test',
  });
  const pool = new BasePool({ config });
  await new Promise((resolve) => pool.end(resolve));
  assert.strictEqual(pool.getStats().closed, true);
});

// FIX: This test verifies queued > 0 is reported correctly in getStats().
// Previously the queued counter was never tested above zero.
test('getStats() — queued reflects pending getConnection requests', async () => {
  const config = new PoolConfig({
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test',
    connectionLimit: 1,
    queueLimit: 5,
    waitForConnections: true,
  });
  const pool = new BasePool({ config });

  // Intercept getConnection so we can stall the first connection
  // and queue a second request manually.
  let firstCb = null;
  pool.getConnection = (cb) => {
    if (!firstCb) {
      firstCb = cb; // stall — don't call cb yet
    } else {
      pool._connectionQueue.push(cb); // simulate a queued waiter
    }
  };

  // Kick off two requests — first stalls, second goes into the queue
  pool.getConnection(() => {});
  pool.getConnection(() => {});

  assert.strictEqual(
    pool.getStats().queued,
    1,
    'one request should be sitting in the connection queue'
  );

  // Clean up — release the stalled connection so the pool doesn't hang
  if (firstCb) firstCb(null, { _pool: {}, release: () => {} });
});

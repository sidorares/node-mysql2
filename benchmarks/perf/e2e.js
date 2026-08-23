'use strict';

// E2E benchmark scenarios against a real MySQL server.
// Usage: node benchmarks/perf/e2e.js <scenario> [--port 3308]
// Run each scenario in its own process for clean JIT/GC state.

const mysql = require('../../promise.js');
const { benchAsync } = require('./helpers.js');

const PORT = Number(process.env.MYSQL_PORT || 3308);

const scenarios = {
  // --- small command/response loops ---
  'insert-one-query': async (conn) =>
    benchAsync('insert-one-query', () =>
      conn.query('INSERT INTO t_insert (a, b) VALUES (?, ?)', [
        42,
        'hello world payload',
      ])
    ),
  'insert-one-execute': async (conn) =>
    benchAsync('insert-one-execute', () =>
      conn.execute('INSERT INTO t_insert (a, b) VALUES (?, ?)', [
        42,
        'hello world payload',
      ])
    ),
  ping: async (conn) => benchAsync('ping', () => conn.ping()),
  'select-1-const': async (conn) =>
    benchAsync('select-1-const', () => conn.query('SELECT 1 + 1 AS solution')),

  // --- one row ---
  'select-1row-query': async (conn) =>
    benchAsync('select-1row-query', () =>
      conn.query('SELECT * FROM t_cols10 WHERE id = ?', [500])
    ),
  'select-1row-execute': async (conn) =>
    benchAsync('select-1row-execute', () =>
      conn.execute('SELECT * FROM t_cols10 WHERE id = ?', [500])
    ),

  // --- small result sets ---
  'select-100rows-10cols-query': async (conn) =>
    benchAsync('select-100rows-10cols-query', () =>
      conn.query('SELECT * FROM t_cols10 WHERE id <= 100')
    ),
  'select-100rows-10cols-execute': async (conn) =>
    benchAsync('select-100rows-10cols-execute', () =>
      conn.execute('SELECT * FROM t_cols10 WHERE id <= ?', [100])
    ),
  'select-100rows-100cols-query': async (conn) =>
    benchAsync('select-100rows-100cols-query', () =>
      conn.query('SELECT * FROM t_cols100 WHERE id <= 100')
    ),
  'select-100rows-100cols-execute': async (conn) =>
    benchAsync('select-100rows-100cols-execute', () =>
      conn.execute('SELECT * FROM t_cols100 WHERE id <= ?', [100])
    ),

  // --- large result sets ---
  'select-10k-query': async (conn) =>
    benchAsync('select-10k-query', () =>
      conn.query('SELECT * FROM t_large WHERE id <= 10000')
    ),
  'select-10k-execute': async (conn) =>
    benchAsync('select-10k-execute', () =>
      conn.execute('SELECT * FROM t_large WHERE id <= ?', [10000])
    ),
  'select-100k-query': async (conn) =>
    benchAsync(
      'select-100k-query',
      () => conn.query('SELECT * FROM t_large WHERE id <= 100000'),
      {
        minMs: 5000,
      }
    ),
  'select-100k-10cols-query': async (conn) =>
    benchAsync(
      'select-100k-10cols-query',
      () => conn.query('SELECT * FROM t_cols10'),
      {
        minMs: 5000,
      }
    ),
  'select-1m-query': async (conn) =>
    benchAsync('select-1m-query', () => conn.query('SELECT * FROM t_large'), {
      minMs: 10000,
      minIter: 3,
    }),
  'select-1m-query-arrays': async (conn) =>
    benchAsync(
      'select-1m-query-arrays',
      () => conn.query({ sql: 'SELECT * FROM t_large', rowsAsArray: true }),
      { minMs: 10000, minIter: 3 }
    ),
  'select-100k-dates-query': async (conn) =>
    benchAsync(
      'select-100k-dates-query',
      () => conn.query('SELECT * FROM t_dates'),
      {
        minMs: 5000,
      }
    ),
  'select-100k-dates-datestrings': async (conn) =>
    benchAsync(
      'select-100k-dates-datestrings',
      () => conn.query({ sql: 'SELECT * FROM t_dates', dateStrings: true }),
      { minMs: 5000 }
    ),
};

async function main() {
  const name = process.argv[2];
  if (!name || !scenarios[name]) {
    console.error(
      `Usage: node e2e.js <scenario>\nScenarios:\n  ${Object.keys(scenarios).join('\n  ')}`
    );
    process.exit(1);
  }
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: PORT,
    user: 'root',
    database: 'test',
    trace: process.env.BENCH_TRACE !== '0',
  });
  try {
    await scenarios[name](conn);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

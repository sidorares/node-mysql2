'use strict';

// Creates benchmark tables and data. Idempotent: skips tables that already
// have the expected row count.
const mysql = require('../../promise.js');

const PORT = Number(process.env.MYSQL_PORT || 3308);

function colsDDL(n) {
  const cols = [];
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) {
      cols.push(`c${i} INT NOT NULL`);
    } else {
      cols.push(`c${i} VARCHAR(32) NOT NULL`);
    }
  }
  return cols.join(', ');
}

function colsValues(n, row) {
  const vals = [];
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) {
      vals.push(String(row * 31 + i));
    } else {
      vals.push(`'value_${row}_${i}'`);
    }
  }
  return vals.join(', ');
}

async function ensureTable(conn, name, ddl, targetRows, insertBatch) {
  await conn.query(`CREATE TABLE IF NOT EXISTS ${name} (${ddl}) ENGINE=InnoDB`);
  const [[{ c }]] = await conn.query(`SELECT COUNT(*) c FROM ${name}`);
  if (Number(c) >= targetRows) {
    console.log(`${name}: ok (${c} rows)`);
    return;
  }
  await conn.query(`TRUNCATE TABLE ${name}`);
  await insertBatch(conn);
  console.log(`${name}: populated ${targetRows} rows`);
}

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: PORT,
    user: 'root',
    database: 'test',
    multipleStatements: true,
  });
  await conn.query('SET SESSION cte_max_recursion_depth = 1100000');

  // 3-column table for large row-count scans
  await ensureTable(
    conn,
    't_large',
    'id INT NOT NULL PRIMARY KEY, name VARCHAR(32) NOT NULL, val DOUBLE NOT NULL',
    1000000,
    (c) =>
      c.query(
        `INSERT INTO t_large
         WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 1000000)
         SELECT n, CONCAT('name_', n), n * 1.5 FROM seq`
      )
  );

  // 10-column mixed table, 100k rows
  await ensureTable(
    conn,
    't_cols10',
    `id INT NOT NULL PRIMARY KEY, ${colsDDL(10)}`,
    100000,
    async (c) => {
      await c.query('SET SESSION cte_max_recursion_depth = 1100000');
      const exprs = [];
      for (let i = 0; i < 10; i++) {
        exprs.push(
          i % 2 === 0 ? `n*31+${i}` : `CONCAT('value_', n, '_', ${i})`
        );
      }
      await c.query(
        `INSERT INTO t_cols10
         WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 100000)
         SELECT n, ${exprs.join(', ')} FROM seq`
      );
    }
  );

  // 100-column table, 1000 rows
  await ensureTable(
    conn,
    't_cols100',
    `id INT NOT NULL PRIMARY KEY, ${colsDDL(100)}`,
    1000,
    async (c) => {
      const rows = [];
      for (let r = 1; r <= 1000; r++) {
        rows.push(`(${r}, ${colsValues(100, r)})`);
      }
      await c.query(`INSERT INTO t_cols100 VALUES ${rows.join(',')}`);
    }
  );

  // datetime-heavy table, 100k rows
  await ensureTable(
    conn,
    't_dates',
    'id INT NOT NULL PRIMARY KEY, created_at DATETIME NOT NULL, updated_at TIMESTAMP NOT NULL, d DATE NOT NULL',
    100000,
    async (c) => {
      await c.query('SET SESSION cte_max_recursion_depth = 1100000');
      await c.query(
        `INSERT INTO t_dates
         WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 100000)
         SELECT n,
                DATE_ADD('2020-01-01 00:00:00', INTERVAL n SECOND),
                DATE_ADD('2020-01-01 00:00:00', INTERVAL n SECOND),
                DATE_ADD('2020-01-01', INTERVAL n % 3650 DAY)
         FROM seq`
      );
    }
  );

  // insert-loop target table
  await conn.query(
    'CREATE TABLE IF NOT EXISTS t_insert (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, a INT NOT NULL, b VARCHAR(64) NOT NULL) ENGINE=InnoDB'
  );
  console.log('t_insert: ok');

  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

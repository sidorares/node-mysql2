import mysql from '../../promise.js';
import { connectionConfig } from './drivers.mjs';
import { createRng, makeBlob, makeText } from './common.mjs';
import { LARGE_VALUE_BYTES, USER_COUNT, WIDE_COUNT } from './scenarios.mjs';

const BATCH = 2000;
const COUNTRIES = ['US', 'DE', 'FR', 'GB', 'JP', 'BR', 'IN', 'NZ', 'AU', 'CA'];
const NAMES = [
  'Ana',
  'Bob',
  'Chen',
  'Dmitri',
  'Élodie',
  'Fatima',
  'Günter',
  'Hiro',
  'Inés',
  'José',
];

const WIDE_COLUMNS = [
  ...Array.from({ length: 8 }, (_, i) => [`i${i}`, 'INT NOT NULL']),
  ...Array.from({ length: 4 }, (_, i) => [`b${i}`, 'BIGINT NOT NULL']),
  ...Array.from({ length: 4 }, (_, i) => [`d${i}`, 'DECIMAL(14,4) NOT NULL']),
  ...Array.from({ length: 4 }, (_, i) => [`f${i}`, 'DOUBLE NOT NULL']),
  ...Array.from({ length: 10 }, (_, i) => [`s${i}`, 'VARCHAR(64) NOT NULL']),
  ...Array.from({ length: 3 }, (_, i) => [`t${i}`, 'DATETIME NOT NULL']),
  ...Array.from({ length: 2 }, (_, i) => [`dt${i}`, 'DATE NOT NULL']),
  ['meta', 'JSON NOT NULL'],
  ['flag', 'TINYINT(1) NOT NULL'],
  ['note', 'TEXT NOT NULL'],
  ['tag', 'VARBINARY(32) NOT NULL'],
];

const DDL = [
  'DROP TABLE IF EXISTS users, events, events_bh, wide, docs, sink_bh',
  `CREATE TABLE users (
    id INT UNSIGNED NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    status TINYINT NOT NULL,
    balance DECIMAL(12,2) NOT NULL,
    country CHAR(2) NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`,
  `CREATE TABLE events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    kind VARCHAR(32) NOT NULL,
    payload VARCHAR(255) NOT NULL,
    created_at DATETIME(3) NOT NULL,
    KEY idx_user (user_id)
  ) ENGINE=InnoDB`,
  `CREATE TABLE events_bh (
    user_id INT UNSIGNED NOT NULL,
    kind VARCHAR(32) NOT NULL,
    payload VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    created_at DATETIME NOT NULL
  ) ENGINE=BLACKHOLE`,
  `CREATE TABLE wide (
    id INT UNSIGNED NOT NULL PRIMARY KEY,
    ${WIDE_COLUMNS.map(([name, type]) => `${name} ${type}`).join(',\n    ')}
  ) ENGINE=InnoDB`,
  `CREATE TABLE docs (
    id INT UNSIGNED NOT NULL PRIMARY KEY,
    body LONGTEXT NOT NULL,
    data LONGBLOB NOT NULL
  ) ENGINE=InnoDB`,
  `CREATE TABLE sink_bh (
    id INT UNSIGNED,
    body LONGTEXT,
    data LONGBLOB
  ) ENGINE=BLACKHOLE`,
];

function userRow(id, rng) {
  const name = NAMES[rng.int(0, NAMES.length)];
  return [
    id,
    `${name.toLowerCase()}.${id}@example.com`,
    `${name} ${String.fromCharCode(65 + (id % 26))}.`,
    rng.int(0, 4),
    (rng.int(0, 10_000_000) / 100).toFixed(2),
    COUNTRIES[id % COUNTRIES.length],
    new Date(Date.UTC(2020, 0, 1) + id * 600_000),
  ];
}

function wideRow(id, rng) {
  const row = [id];
  for (const [name, type] of WIDE_COLUMNS) {
    if (type.startsWith('INT')) row.push(rng.int(-1e9, 1e9));
    else if (type.startsWith('BIGINT'))
      row.push(rng.int(0, 2 ** 31) * 4096 + rng.int(0, 4096));
    else if (type.startsWith('DECIMAL'))
      row.push((rng.int(0, 1e9) / 1e4).toFixed(4));
    else if (type.startsWith('DOUBLE')) row.push(rng.next() * 1e6);
    else if (type.startsWith('VARCHAR'))
      row.push(`${name}-${id}-${'abcdefgh'.repeat(rng.int(0, 6))}`);
    else if (type.startsWith('DATETIME'))
      row.push(new Date(Date.UTC(2024, 0, 1) + rng.int(0, 3e8) * 1000));
    else if (type.startsWith('DATE'))
      row.push(new Date(Date.UTC(2024, 0, 1) + rng.int(0, 3000) * 86_400_000));
    else if (type.startsWith('JSON'))
      row.push(
        JSON.stringify({
          id,
          tags: ['a', 'b'],
          score: rng.next(),
          nested: { ok: true },
        })
      );
    else if (type.startsWith('TINYINT')) row.push(rng.int(0, 2));
    else if (type.startsWith('TEXT'))
      row.push(`note for ${id}: ${'lorem ipsum '.repeat(rng.int(5, 20))}`);
    else row.push(Buffer.from(`tag-${id}`));
  }
  return row;
}

async function insertBatches(connection, table, columns, count, makeRow) {
  const rng = createRng(table.length * 31);
  for (let start = 1; start <= count; start += BATCH) {
    const rows = [];
    for (let id = start; id < Math.min(start + BATCH, count + 1); id++)
      rows.push(makeRow(id, rng));
    await connection.query(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES ?`,
      [rows]
    );
  }
}

async function main() {
  const connection = await mysql.createConnection({
    ...connectionConfig(),
    timezone: 'Z',
  });
  for (const statement of DDL) await connection.query(statement);

  await insertBatches(
    connection,
    'users',
    ['id', 'email', 'name', 'status', 'balance', 'country', 'created_at'],
    USER_COUNT,
    userRow
  );
  await insertBatches(
    connection,
    'wide',
    ['id', ...WIDE_COLUMNS.map(([name]) => name)],
    WIDE_COUNT,
    wideRow
  );
  await connection.query('INSERT INTO docs (id, body, data) VALUES (?, ?, ?)', [
    1,
    makeText(LARGE_VALUE_BYTES, 7),
    makeBlob(LARGE_VALUE_BYTES, 11),
  ]);
  await connection.query('ANALYZE TABLE users, wide, docs');

  const [[counts]] = await connection.query(
    'SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM wide) AS wide, (SELECT LENGTH(body) FROM docs WHERE id = 1) AS bodyBytes'
  );
  console.log('seeded', counts);
  await connection.end();
}

main().catch((error) => {
  console.error(`setup failed: ${error && error.message}`);
  process.exit(1);
});

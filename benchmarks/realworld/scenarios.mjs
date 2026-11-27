import { makeBlob, makeText } from './common.mjs';

export const USER_COUNT = 100_000;
export const WIDE_COUNT = 10_000;
export const LARGE_VALUE_BYTES = 1 << 20;
const BULK_ROWS = 1000;

const randomUserId = (s) => s.rng.int(1, USER_COUNT + 1);

let largeText;
let largeBlob;
const getLargeText = () => (largeText ??= makeText(LARGE_VALUE_BYTES, 7));
const getLargeBlob = () => (largeBlob ??= makeBlob(LARGE_VALUE_BYTES, 11));

const bulkRows = Array.from({ length: BULK_ROWS }, (_, i) => ({
  user_id: i + 1,
  kind: i % 3 === 0 ? 'purchase' : 'view',
  payload: `item-${i}-${'x'.repeat(i % 40)}`,
  amount: (i * 1.25).toFixed(2),
  created_at: new Date(Date.UTC(2026, 0, 1, 0, 0, i % 60)),
}));
const bulkArrays = bulkRows.map((r) => [
  r.user_id,
  r.kind,
  r.payload,
  r.amount,
  r.created_at,
]);
const bulkFlat = bulkArrays.flat();
const bulkPlaceholders = Array.from(
  { length: BULK_ROWS },
  () => '(?, ?, ?, ?, ?)'
).join(', ');

const pk = {
  mysql2: (d, s) =>
    d.run('SELECT * FROM users WHERE id = ?', [randomUserId(s)]),
  bun: ({ sql }, s) => sql`SELECT * FROM users WHERE id = ${randomUserId(s)}`,
};

const scan10k = {
  mysql2: (d, s) =>
    d.run('SELECT * FROM users WHERE id >= ? ORDER BY id LIMIT 10000', [
      s.rng.int(1, USER_COUNT - 10_000),
    ]),
  bun: ({ sql }, s) =>
    sql`SELECT * FROM users WHERE id >= ${s.rng.int(1, USER_COUNT - 10_000)} ORDER BY id LIMIT 10000`,
};

export const SCENARIOS = {
  select1: {
    describe: 'SELECT 1: pure protocol + driver overhead',
    mysql2: (d) => d.run('SELECT 1'),
    bun: ({ sql }) => sql`SELECT 1`,
  },

  pk: {
    describe: 'CRUD read: 1 row by primary key, 8 columns',
    rows: 1,
    ...pk,
  },

  list50: {
    describe: 'CRUD list page: 50 rows x 8 columns',
    rows: 50,
    mysql2: (d, s) =>
      d.run('SELECT * FROM users WHERE id >= ? ORDER BY id LIMIT 50', [
        s.rng.int(1, USER_COUNT - 50),
      ]),
    bun: ({ sql }, s) =>
      sql`SELECT * FROM users WHERE id >= ${s.rng.int(1, USER_COUNT - 50)} ORDER BY id LIMIT 50`,
  },

  insert: {
    describe: 'CRUD create: 1 small row into InnoDB',
    mysql2: (d, s) =>
      d.run(
        'INSERT INTO events (user_id, kind, payload, created_at) VALUES (?, ?, ?, ?)',
        [randomUserId(s), 'signup', 'utm=bench', new Date()]
      ),
    bun: ({ sql }, s) =>
      sql`INSERT INTO events (user_id, kind, payload, created_at) VALUES (${randomUserId(s)}, ${'signup'}, ${'utm=bench'}, ${new Date()})`,
  },

  update: {
    describe: 'CRUD update: 1 row by primary key',
    mysql2: (d, s) =>
      d.run(
        'UPDATE users SET balance = balance + ?, updated_at = ? WHERE id = ?',
        [1, new Date(), randomUserId(s)]
      ),
    bun: ({ sql }, s) =>
      sql`UPDATE users SET balance = balance + ${1}, updated_at = ${new Date()} WHERE id = ${randomUserId(s)}`,
  },

  tx: {
    describe: 'Transaction: BEGIN, SELECT FOR UPDATE, UPDATE, INSERT, COMMIT',
    mysql2: (d, s) => {
      const id = randomUserId(s);
      return d.transaction(async (run) => {
        await run('SELECT balance FROM users WHERE id = ? FOR UPDATE', [id]);
        await run('UPDATE users SET balance = balance - ? WHERE id = ?', [
          1,
          id,
        ]);
        await run(
          'INSERT INTO events (user_id, kind, payload, created_at) VALUES (?, ?, ?, ?)',
          [id, 'debit', 'tx', new Date()]
        );
      });
    },
    bun: ({ sql }, s) => {
      const id = randomUserId(s);
      return sql.begin(async (tx) => {
        await tx`SELECT balance FROM users WHERE id = ${id} FOR UPDATE`;
        await tx`UPDATE users SET balance = balance - ${1} WHERE id = ${id}`;
        await tx`INSERT INTO events (user_id, kind, payload, created_at) VALUES (${id}, ${'debit'}, ${'tx'}, ${new Date()})`;
      });
    },
  },

  web: {
    describe: 'Web request: PK read + 20-row list, 10% also update',
    mysql2: async (d, s) => {
      const id = randomUserId(s);
      await d.run('SELECT * FROM users WHERE id = ?', [id]);
      await d.run('SELECT * FROM users WHERE id >= ? ORDER BY id LIMIT 20', [
        Math.min(id, USER_COUNT - 20),
      ]);
      if (s.rng.next() < 0.1) {
        await d.run('UPDATE users SET updated_at = ? WHERE id = ?', [
          new Date(),
          id,
        ]);
      }
    },
    bun: async ({ sql }, s) => {
      const id = randomUserId(s);
      await sql`SELECT * FROM users WHERE id = ${id}`;
      await sql`SELECT * FROM users WHERE id >= ${Math.min(id, USER_COUNT - 20)} ORDER BY id LIMIT 20`;
      if (s.rng.next() < 0.1) {
        await sql`UPDATE users SET updated_at = ${new Date()} WHERE id = ${id}`;
      }
    },
  },

  wide100: {
    describe:
      'Report page: 100 rows x 40 mixed columns (JSON, dates, decimals, bigint)',
    rows: 100,
    mysql2: (d, s) =>
      d.run('SELECT * FROM wide WHERE id >= ? ORDER BY id LIMIT 100', [
        s.rng.int(1, WIDE_COUNT - 100),
      ]),
    bun: ({ sql }, s) =>
      sql`SELECT * FROM wide WHERE id >= ${s.rng.int(1, WIDE_COUNT - 100)} ORDER BY id LIMIT 100`,
  },

  scan10k: {
    describe: 'Export: 10,000 rows x 8 columns',
    rows: 10_000,
    ...scan10k,
  },

  scan100k: {
    describe: 'Large export: all 100,000 rows x 8 columns in one result',
    rows: 100_000,
    mysql2: (d) => d.run('SELECT * FROM users'),
    bun: ({ sql }) => sql`SELECT * FROM users`,
  },

  'text1m-read': {
    describe: 'Large row read: one 1 MiB LONGTEXT value (utf8)',
    mysql2: (d) => d.run('SELECT body FROM docs WHERE id = ?', [1]),
    bun: ({ sql }) => sql`SELECT body FROM docs WHERE id = ${1}`,
  },

  'blob1m-read': {
    describe: 'Large row read: one 1 MiB LONGBLOB value',
    mysql2: (d) => d.run('SELECT data FROM docs WHERE id = ?', [1]),
    bun: ({ sql }) => sql`SELECT data FROM docs WHERE id = ${1}`,
  },

  'text1m-insert': {
    describe:
      'Large row write: 1 MiB string parameter (BLACKHOLE table, client-bound)',
    mysql2: (d, s) =>
      d.run('INSERT INTO sink_bh (id, body) VALUES (?, ?)', [
        s.vu,
        getLargeText(),
      ]),
    bun: ({ sql }, s) =>
      sql`INSERT INTO sink_bh (id, body) VALUES (${s.vu}, ${getLargeText()})`,
  },

  'blob1m-insert': {
    describe:
      'Large row write: 1 MiB Buffer parameter (BLACKHOLE table, client-bound)',
    mysql2: (d, s) =>
      d.run('INSERT INTO sink_bh (id, data) VALUES (?, ?)', [
        s.vu,
        getLargeBlob(),
      ]),
    bun: ({ sql }, s) =>
      sql`INSERT INTO sink_bh (id, data) VALUES (${s.vu}, ${getLargeBlob()})`,
  },

  bulk1000: {
    describe:
      'Bulk insert: 1000 rows x 5 columns in one statement (BLACKHOLE table)',
    mysql2: (d) =>
      d.mode === 'query'
        ? d.run(
            'INSERT INTO events_bh (user_id, kind, payload, amount, created_at) VALUES ?',
            [bulkArrays]
          )
        : d.run(
            `INSERT INTO events_bh (user_id, kind, payload, amount, created_at) VALUES ${bulkPlaceholders}`,
            bulkFlat
          ),
    bun: ({ sql }) => sql`INSERT INTO events_bh ${sql(bulkRows)}`,
  },

  connect: {
    describe: 'Serverless style: connect, SELECT 1, disconnect',
    mysql2: (d) => d.connectOnce(),
    bun: (d) => d.connectOnce(),
  },

  noisy: {
    describe:
      'Noisy neighbour: PK reads while VU 0 runs 10k-row scans in the same process',
    label: (s) => (s.vu === 0 ? 'scan10k' : 'pk'),
    mysql2: (d, s) => (s.vu === 0 ? scan10k.mysql2(d, s) : pk.mysql2(d, s)),
    bun: (d, s) => (s.vu === 0 ? scan10k.bun(d, s) : pk.bun(d, s)),
  },
};

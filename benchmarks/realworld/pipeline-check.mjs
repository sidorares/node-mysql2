import assert from 'node:assert/strict';
import mysql from '../../promise.js';
import { connectionConfig } from './drivers.mjs';

const checks = [];
const check = (name, fn) => checks.push({ name, fn });

check('concurrent queries resolve to their own results', async (c) => {
  const values = Array.from({ length: 500 }, (_, i) => i);
  const results = await Promise.all(
    values.map((v) => c.query('SELECT ? AS v', [v]))
  );
  results.forEach(([rows], i) => assert.equal(rows[0].v, i));
});

check('an error fails only its own command', async (c) => {
  const outcomes = await Promise.allSettled(
    Array.from({ length: 60 }, (_, i) =>
      i % 7 === 3
        ? c.query('SELECT * FROM no_such_table_xyz')
        : c.query('SELECT ? AS v', [i])
    )
  );
  outcomes.forEach((o, i) => {
    if (i % 7 === 3) assert.equal(o.status, 'rejected');
    else assert.equal(o.value[0][0].v, i);
  });
});

check('execute: first use prepares, later uses pipeline', async (c) => {
  const ids = Array.from({ length: 300 }, (_, i) => 1 + ((i * 37) % 100_000));
  const results = await Promise.all(
    ids.map((id) => c.execute('SELECT id FROM users WHERE id = ?', [id]))
  );
  results.forEach(([rows], i) => assert.equal(rows[0].id, ids[i]));
});

check('mixed query/execute with a 10k-row result in the middle', async (c) => {
  const ops = Array.from({ length: 120 }, (_, i) => {
    if (i === 60)
      return c
        .query('SELECT * FROM users ORDER BY id LIMIT 10000')
        .then(([r]) => r.length);
    return (
      i % 2 ? c.execute('SELECT ? AS v', [i]) : c.query('SELECT ? AS v', [i])
    ).then(([r]) => r[0].v);
  });
  const results = await Promise.all(ops);
  results.forEach((r, i) => assert.equal(r, i === 60 ? 10000 : i));
});

check(
  'LOAD DATA LOCAL is refused by the server, pipeline survives',
  async (c) => {
    const outcomes = await Promise.allSettled([
      c.query('SELECT 1 AS v'),
      c.query("LOAD DATA LOCAL INFILE '/etc/passwd' INTO TABLE events_bh"),
      c.query('SELECT 2 AS v'),
    ]);
    assert.equal(outcomes[0].value[0][0].v, 1);
    assert.equal(outcomes[1].status, 'rejected');
    assert.equal(outcomes[2].value[0][0].v, 2);
  }
);

check('non-pipelinable commands act as barriers', async (c) => {
  const ops = [];
  for (let i = 0; i < 50; i++) {
    ops.push(c.query('SELECT ? AS v', [i]).then(([r]) => r[0].v));
    if (i % 10 === 5) ops.push(c.ping().then(() => 'ping'));
  }
  const results = await Promise.all(ops);
  assert.deepEqual(
    results.filter((r) => r !== 'ping'),
    Array.from({ length: 50 }, (_, i) => i)
  );
});

check('sequential transaction is unaffected', async (c) => {
  await c.beginTransaction();
  const [[before]] = await c.query(
    'SELECT balance FROM users WHERE id = 1 FOR UPDATE'
  );
  await c.query('UPDATE users SET balance = balance + 1 WHERE id = 1');
  await c.rollback();
  const [[after]] = await c.query('SELECT balance FROM users WHERE id = 1');
  assert.equal(after.balance, before.balance);
});

async function destroyWithInFlight() {
  const c = await mysql.createConnection({
    ...connectionConfig(),
    pipelining: 32,
  });
  const pending = Array.from({ length: 40 }, () =>
    c.query('SELECT SLEEP(0.01)')
  );
  c.destroy();
  const outcomes = await Promise.allSettled(pending);
  assert.ok(
    outcomes.every((o) => o.status === 'rejected' || o.status === 'fulfilled')
  );
}

const connection = await mysql.createConnection({
  ...connectionConfig(),
  pipelining: 32,
});
assert.equal(connection.connection.config.pipelining, 32);
let failed = 0;
for (const { name, fn } of checks) {
  try {
    await fn(connection);
    console.log(`ok   ${name}`);
  } catch (error) {
    failed++;
    console.log(`FAIL ${name}: ${error.message}`);
  }
}
await connection.end();
try {
  await destroyWithInFlight();
  console.log('ok   destroy() with commands in flight settles every promise');
} catch (error) {
  failed++;
  console.log(`FAIL destroy with in-flight commands: ${error.message}`);
}
process.exit(failed ? 1 : 0);

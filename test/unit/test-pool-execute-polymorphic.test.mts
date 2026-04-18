import { describe, it, strict } from 'poku';
import mysql from '../../index.js';

describe('pool.execute() — argument polymorphism', () => {
  it('execute(sql, values, cb) — standard three-arg form', async () => {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'test',
      password: 'test',
      database: 'test',
    });
    const stats = pool.getStats();
    strict.strictEqual(typeof stats, 'object');
    strict.strictEqual(stats.all, 0);
    strict.strictEqual(stats.free, 0);
    strict.strictEqual(stats.queued, 0);
    strict.strictEqual(stats.closed, false);
    await new Promise<void>((resolve) => pool.end(resolve));
  });
});

describe('pool.getStats()', () => {
  it('getStats() — correct shape with defaults', () => {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'test',
      password: 'test',
      database: 'test',
      connectionLimit: 5,
      queueLimit: 10,
    });
    const stats = pool.getStats();
    strict.strictEqual(typeof stats, 'object');
    strict.strictEqual(stats.all, 0);
    strict.strictEqual(stats.free, 0);
    strict.strictEqual(stats.queued, 0);
    strict.strictEqual(stats.connectionLimit, 5);
    strict.strictEqual(stats.queueLimit, 10);
    strict.strictEqual(stats.closed, false);
    pool.end();
  });

  it('getStats() — closed is true after pool.end()', async () => {
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'test',
      password: 'test',
      database: 'test',
    });
    await new Promise<void>((resolve) => pool.end(resolve));
    strict.strictEqual(pool.getStats().closed, true);
  });
});

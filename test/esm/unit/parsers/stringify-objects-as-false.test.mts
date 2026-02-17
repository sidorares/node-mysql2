import type { format as Format } from 'sql-escaper';
import { assert, describe, it } from 'poku';
import driver from '../../../../index.js';
import { config, localDate } from '../../common.test.mjs';

await describe('stringifyObjects: false', async () => {
  const connection = driver
    .createConnection({
      ...config,
      stringifyObjects: false,
    })
    .promise();

  const format: typeof Format = (sql, values): string =>
    // @ts-expect-error: TODO: implement typings
    connection.connection.format(sql, values);

  await connection.end();

  describe('SELECT without values', () => {
    it('should return the query unchanged', () => {
      const query: string = format('SELECT * FROM users', []);

      assert.strictEqual(query, 'SELECT * FROM users');
    });
  });

  describe('SELECT with object parameter', () => {
    it('should generate a safe query for a legitimate string', () => {
      const query: string = format('SELECT * FROM users WHERE email = ?', [
        'admin@example.com',
      ]);

      assert.strictEqual(
        query,
        "SELECT * FROM users WHERE email = 'admin@example.com'"
      );
    });

    it('should not generate a SQL fragment for object { email: 1 }', () => {
      const query: string = format('SELECT * FROM users WHERE email = ?', [
        { email: 1 },
      ]);

      assert.strictEqual(
        query,
        "SELECT * FROM users WHERE email = '[object Object]'"
      );
    });
  });

  describe('SELECT with multiple parameters', () => {
    it('should generate a safe query for a wrong password', () => {
      const query: string = format(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        ['admin@example.com', 'wrong_password']
      );

      assert.strictEqual(
        query,
        "SELECT * FROM users WHERE email = 'admin@example.com' AND password = 'wrong_password'"
      );
    });

    it('should not alter the query structure for object { email: 1 }', () => {
      const query: string = format(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        [{ email: 1 }, 'user1_pass']
      );

      assert.strictEqual(
        query,
        "SELECT * FROM users WHERE email = '[object Object]' AND password = 'user1_pass'"
      );
    });
  });

  describe('DELETE with object parameter', () => {
    it('should generate a safe query for a legitimate id', () => {
      const query: string = format('DELETE FROM users WHERE id = ?', [1]);

      assert.strictEqual(query, 'DELETE FROM users WHERE id = 1');
    });

    it('should not generate a SQL fragment for object { id: true }', () => {
      const query: string = format('DELETE FROM users WHERE id = ?', [
        { id: true },
      ]);

      assert.strictEqual(
        query,
        "DELETE FROM users WHERE id = '[object Object]'"
      );
    });
  });

  describe('SET with object parameter', () => {
    it('should convert object to key-value pairs for UPDATE SET clause', () => {
      const query: string = format('UPDATE users SET ?', [
        { name: 'foo', email: 'bar@test.com' },
      ]);

      assert.strictEqual(
        query,
        "UPDATE users SET `name` = 'foo', `email` = 'bar@test.com'"
      );
    });

    it('should convert object to key-value pairs for INSERT SET clause', () => {
      const query: string = format('INSERT INTO users SET ?', [
        { name: 'foo', email: 'bar@test.com' },
      ]);

      assert.strictEqual(
        query,
        "INSERT INTO users SET `name` = 'foo', `email` = 'bar@test.com'"
      );
    });

    it('should convert object to key-value pairs for ON DUPLICATE KEY UPDATE clause', () => {
      const query: string = format(
        'INSERT INTO users (name, email) VALUES (?, ?) ON DUPLICATE KEY UPDATE ?',
        ['foo', 'bar@test.com', { name: 'foo', email: 'bar@test.com' }]
      );

      assert.strictEqual(
        query,
        "INSERT INTO users (name, email) VALUES ('foo', 'bar@test.com') ON DUPLICATE KEY UPDATE `name` = 'foo', `email` = 'bar@test.com'"
      );
    });
  });

  describe('SELECT and INSERT with Date parameter', () => {
    it('should format Date as a valid datetime string, not as [object Object]', () => {
      const date = new Date('2026-01-01T10:30:00.000Z');
      const query: string = format(
        'SELECT * FROM events WHERE created_at = ?',
        [date]
      );

      assert.strictEqual(
        query,
        `SELECT * FROM events WHERE created_at = '${localDate(date)}'`
      );
    });

    it('should format Date in INSERT statements', () => {
      const date = new Date('2026-01-01T00:00:00.000Z');
      const query: string = format(
        'INSERT INTO logs (message, created_at) VALUES (?, ?)',
        ['test', date]
      );

      assert.strictEqual(
        query,
        `INSERT INTO logs (message, created_at) VALUES ('test', '${localDate(date)}')`
      );
    });
  });
});

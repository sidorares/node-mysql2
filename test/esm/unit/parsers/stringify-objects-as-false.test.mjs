import { assert, describe, it } from 'poku';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { config } = require('../../../common.test.cjs');
const driver = require('../../../../index.js');

const connection = driver
  .createConnection({
    ...config,
    stringifyObjects: false,
  })
  .promise();

const format = (sql, values) => connection.connection.format(sql, values);

await connection.end();

describe('SELECT without values', () => {
  it('should return the query unchanged', () => {
    const query = format('SELECT * FROM users', []);

    assert.strictEqual(query, 'SELECT * FROM users');
  });
});

describe('SELECT with object parameter', () => {
  it('should generate a safe query for a legitimate string', () => {
    const query = format('SELECT * FROM users WHERE email = ?', [
      'admin@example.com',
    ]);

    assert.strictEqual(
      query,
      "SELECT * FROM users WHERE email = 'admin@example.com'"
    );
  });

  it.todo('should not generate a SQL fragment for object { email: 1 }', () => {
    const query = format('SELECT * FROM users WHERE email = ?', [{ email: 1 }]);

    assert.strictEqual(
      query,
      "SELECT * FROM users WHERE email = '[object Object]'"
    );
  });
});

describe('SELECT with multiple parameters', () => {
  it('should generate a safe query for a wrong password', () => {
    const query = format(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      ['admin@example.com', 'wrong_password']
    );

    assert.strictEqual(
      query,
      "SELECT * FROM users WHERE email = 'admin@example.com' AND password = 'wrong_password'"
    );
  });

  it.todo(
    'should not alter the query structure for object { email: 1 }',
    () => {
      const query = format(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        [{ email: 1 }, 'user1_pass']
      );

      assert.strictEqual(
        query,
        "SELECT * FROM users WHERE email = '[object Object]' AND password = 'user1_pass'"
      );
    }
  );
});

describe('DELETE with object parameter', () => {
  it('should generate a safe query for a legitimate id', () => {
    const query = format('DELETE FROM users WHERE id = ?', [1]);

    assert.strictEqual(query, 'DELETE FROM users WHERE id = 1');
  });

  it.todo('should not generate a SQL fragment for object { id: true }', () => {
    const query = format('DELETE FROM users WHERE id = ?', [{ id: true }]);

    assert.strictEqual(query, "DELETE FROM users WHERE id = '[object Object]'");
  });
});

describe('SET with object parameter', () => {
  it('should convert object to key-value pairs for SET clause', () => {
    const query = format('UPDATE users SET ?', [
      { name: 'foo', email: 'bar@test.com' },
    ]);

    assert.strictEqual(
      query,
      "UPDATE users SET `name` = 'foo', `email` = 'bar@test.com'"
    );
  });
});

describe('SELECT and INSERT with Date parameter', () => {
  it('should format Date as a valid datetime string, not as [object Object]', () => {
    const date = new Date('2026-01-01T10:30:00.000Z');
    const query = format('SELECT * FROM events WHERE created_at = ?', [date]);

    assert.strictEqual(
      query,
      "SELECT * FROM events WHERE created_at = '2026-01-01 10:30:00.000'"
    );
  });

  it('should format Date in INSERT statements', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    const query = format(
      'INSERT INTO logs (message, created_at) VALUES (?, ?)',
      ['test', date]
    );

    assert.strictEqual(
      query,
      "INSERT INTO logs (message, created_at) VALUES ('test', '2026-01-01 00:00:00.000')"
    );
  });
});

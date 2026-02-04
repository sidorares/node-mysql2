import { assert, describe, it } from 'poku';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { config } = require('../../../common.test.cjs');
const driver = require('../../../../index.js');

const connection = driver
  .createConnection({
    ...config,
    stringifyObjects: true,
  })
  .promise();

const format = (sql, values) => connection.connection.format(sql, values);

describe('SELECT with object parameter', () => {
  it('legitimate string should generate a safe query', () => {
    const query = format('SELECT * FROM users WHERE email = ?', [
      'admin@example.com',
    ]);

    assert.strictEqual(
      query,
      "SELECT * FROM users WHERE email = 'admin@example.com'"
    );
  });

  it('object { email: 1 } should not generate a SQL fragment', () => {
    const query = format('SELECT * FROM users WHERE email = ?', [{ email: 1 }]);

    assert.strictEqual(
      query,
      "SELECT * FROM users WHERE email = '[object Object]'"
    );
  });
});

describe('Authentication bypass via object injection', () => {
  it('wrong password should generate a safe query', () => {
    const query = format(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      ['admin@example.com', 'wrong_password']
    );

    assert.strictEqual(
      query,
      "SELECT * FROM users WHERE email = 'admin@example.com' AND password = 'wrong_password'"
    );
  });

  it('object { email: 1 } should not alter the query structure', () => {
    const query = format(
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
  it('legitimate id should generate a safe query', () => {
    const query = format('DELETE FROM users WHERE id = ?', [1]);

    assert.strictEqual(query, 'DELETE FROM users WHERE id = 1');
  });

  it('object { id: true } should not generate a SQL fragment', () => {
    const query = format('DELETE FROM users WHERE id = ?', [{ id: true }]);

    assert.strictEqual(query, "DELETE FROM users WHERE id = '[object Object]'");
  });
});

describe('SET with object parameter (stringifyObjects: true)', () => {
  it('should stringify object instead of expanding to key-value pairs', () => {
    const query = format('UPDATE users SET ?', [
      { name: 'foo', email: 'bar@test.com' },
    ]);

    assert.strictEqual(query, "UPDATE users SET '[object Object]'");
  });
});

await connection.end();

import EventEmitter from 'node:events';
import { describe, it, strict } from 'poku';
import BaseConnection from '../../../lib/base/connection.js';
import ConnectionConfig from '../../../lib/connection_config.js';

function createMockConnection(namedPlaceholders?: boolean) {
  const config = new ConnectionConfig({
    host: 'localhost',
    user: 'test',
    password: 'test',
    database: 'test',
    connectTimeout: 0,
    namedPlaceholders,
  });

  const mockStream = Object.assign(new EventEmitter(), {
    write: () => true,
    end: () => {},
    destroy() {
      this.destroyed = true;
    },
    destroyed: false,
    setKeepAlive: () => {},
    setNoDelay: () => {},
  });

  config.stream = mockStream;
  config.isServer = true;

  return new BaseConnection({ config });
}

describe('_resolveNamedPlaceholders query-level override', () => {
  it('config true + options false does not convert', () => {
    const conn = createMockConnection(true);
    const options = {
      sql: 'SELECT :name AS result',
      values: { name: 1 },
      namedPlaceholders: false,
    };

    conn._resolveNamedPlaceholders(options);

    strict.equal(options.sql, 'SELECT :name AS result');
    strict.deepEqual(options.values, { name: 1 });
  });

  it('config false + options true converts named placeholders', () => {
    const conn = createMockConnection(false);
    const options = {
      sql: 'SELECT :name AS result',
      values: { name: 1 },
      namedPlaceholders: true,
    };

    conn._resolveNamedPlaceholders(options);

    strict.equal(options.sql, 'SELECT ? AS result');
    strict.deepEqual(options.values, [1]);
  });

  it('options undefined uses connection config', () => {
    const enabled = createMockConnection(true);
    const enabledOpts = {
      sql: 'SELECT :name AS result',
      values: { name: 1 },
    };
    enabled._resolveNamedPlaceholders(enabledOpts);
    strict.equal(enabledOpts.sql, 'SELECT ? AS result');
    strict.deepEqual(enabledOpts.values, [1]);

    const disabled = createMockConnection(false);
    const disabledOpts = {
      sql: 'SELECT :name AS result',
      values: { name: 1 },
    };
    disabled._resolveNamedPlaceholders(disabledOpts);
    strict.equal(disabledOpts.sql, 'SELECT :name AS result');
    strict.deepEqual(disabledOpts.values, { name: 1 });
  });

  it('format honors query-level namedPlaceholders false with config true', () => {
    const conn = createMockConnection(true);
    const sql = conn.format(
      'SELECT :name AS result',
      { name: 1 },
      false
    );
    strict.ok(sql.includes(':name'), 'format should leave :name when disabled');
  });

  it('format converts when namedPlaceholders true overrides config false', () => {
    const conn = createMockConnection(false);
    const sql = conn.format(
      'SELECT :name AS result',
      { name: 1 },
      true
    );
    strict.equal(sql, 'SELECT 1 AS result');
  });
});

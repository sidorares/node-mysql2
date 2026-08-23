import { describe, it, strict } from 'poku';
import BasePool from '../../../lib/base/pool.js';
import ConnectionConfig from '../../../lib/connection_config.js';

const createPool = () => {
  const pool = Object.create(BasePool.prototype);

  pool.config = {
    connectionConfig: new ConnectionConfig({
      user: 'root',
      database: 'test',
    }),
  };

  return pool;
};

describe('pool connection config isolation', () => {
  it('creates a new config object for every connection', () => {
    const pool = createPool();

    const first = pool._createConnectionConfig();
    const second = pool._createConnectionConfig();

    strict.notStrictEqual(first, pool.config.connectionConfig);
    strict.notStrictEqual(second, pool.config.connectionConfig);
    strict.notStrictEqual(first, second);
  });

  it('keeps the values and the prototype of the pool config', () => {
    const pool = createPool();
    const config = pool._createConnectionConfig();

    strict.ok(config instanceof ConnectionConfig);
    strict.strictEqual(config.user, 'root');
    strict.strictEqual(config.database, 'test');
    strict.strictEqual(
      config.charsetNumber,
      pool.config.connectionConfig.charsetNumber
    );
  });

  it('does not leak changeUser mutations to other connections', () => {
    const pool = createPool();
    const changed = pool._createConnectionConfig();

    // `ChangeUser` rewrites `connection.config` in place,
    // see `lib/commands/change_user.js`.
    changed.user = 'changeuser1';
    changed.database = 'other';

    const fresh = pool._createConnectionConfig();

    strict.strictEqual(pool.config.connectionConfig.user, 'root');
    strict.strictEqual(pool.config.connectionConfig.database, 'test');
    strict.strictEqual(fresh.user, 'root');
    strict.strictEqual(fresh.database, 'test');
  });
});

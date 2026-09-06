import { describe, it, strict } from 'poku';
import ConnectionConfig from '../../../lib/connection_config.js';

describe('ConnectionConfig.queryOptions', () => {
  const config = new ConnectionConfig({
    host: 'example.com',
    port: 3307,
    user: 'user',
    password: 'secret',
    database: 'db',
    timezone: '+02:00',
    nestTables: '_',
    dateStrings: ['DATE'],
    supportBigNumbers: true,
  });
  const overrides = {
    sql: 'SELECT 1',
    values: [1],
    rowsAsArray: true,
    infileStreamFactory: undefined,
    timezone: 'Z',
  };

  it('copies every own option of the config, in the same order', () => {
    const copy = ConnectionConfig.queryOptions(config, {});

    strict.deepEqual(Object.entries(copy), Object.entries(config));
    strict.equal(copy.ssl, config.ssl);
    strict.equal(copy.connectAttributes, config.connectAttributes);
    strict.equal(copy.dateStrings, config.dateStrings);
  });

  it('matches Object.assign({}, config, overrides) exactly', () => {
    const expected = Object.assign({}, config, overrides);
    const copy = ConnectionConfig.queryOptions(config, overrides);

    strict.deepEqual(Object.entries(copy), Object.entries(expected));
    strict.equal(copy.timezone, 'Z');
    strict.equal(copy.rowsAsArray, true);
    strict.equal(copy.nestTables, '_');
    strict.equal(copy.values, overrides.values);
  });

  it('returns a fresh object and leaves the config untouched', () => {
    const copy = ConnectionConfig.queryOptions(config, { timezone: 'Z' });
    copy.timezone = 'local';
    copy.nestTables = true;

    strict.equal(config.timezone, '+02:00');
    strict.equal(config.nestTables, '_');
    strict.notEqual(ConnectionConfig.queryOptions(config, {}), copy);
  });

  it('works for configs cloned with their prototype, as the pool does', () => {
    const cloned = Object.create(
      Object.getPrototypeOf(config),
      Object.getOwnPropertyDescriptors(config)
    );
    const copy = ConnectionConfig.queryOptions(cloned, { rowsAsArray: true });

    strict.deepEqual(Object.keys(copy), Object.keys(config));
    strict.equal(copy.rowsAsArray, true);
    strict.equal(copy.host, 'example.com');
  });

  it('falls back to a plain merge for objects that are not a ConnectionConfig', () => {
    const copy = ConnectionConfig.queryOptions(
      { typeCast: false, custom: 1 },
      { rowsAsArray: true }
    );

    strict.deepEqual(copy, { typeCast: false, custom: 1, rowsAsArray: true });
  });
});

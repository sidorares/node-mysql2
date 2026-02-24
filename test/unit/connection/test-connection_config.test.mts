import { describe, it, strict } from 'poku';
import ConnectionConfig from '../../../lib/connection_config.js';
import SSLProfiles from '../../../lib/constants/ssl_profiles.js';

describe('ConnectionConfig', () => {
  it('should throw on boolean ssl', () => {
    const expectedMessage =
      "SSL profile must be an object, instead it's a boolean";

    strict.throws(
      () =>
        new ConnectionConfig({
          ssl: true,
        }),
      (err: unknown) =>
        err instanceof TypeError && err.message === expectedMessage,
      'Error, the constructor accepts a boolean without throwing the right exception'
    );
  });

  it('should accept object ssl', () => {
    strict.doesNotThrow(
      () =>
        new ConnectionConfig({
          ssl: {},
        }),
      'Error, the constructor accepts an object but throws an exception'
    );
  });

  it('should accept string ssl profile', () => {
    strict.doesNotThrow(() => {
      const sslProfile = Object.keys(SSLProfiles)[0];
      new ConnectionConfig({
        ssl: sslProfile,
      });
    }, 'Error, the constructor accepts a string but throws an exception');
  });

  it('should accept flags string', () => {
    strict.doesNotThrow(() => {
      new ConnectionConfig({
        flags: '-FOUND_ROWS',
      });
    }, 'Error, the constructor threw an exception due to a flags string');
  });

  it('should accept flags array', () => {
    strict.doesNotThrow(() => {
      new ConnectionConfig({
        flags: ['-FOUND_ROWS'],
      });
    }, 'Error, the constructor threw an exception due to a flags array');
  });

  it('should parse password from URL', () => {
    strict.strictEqual(
      ConnectionConfig.parseUrl(
        String.raw`fml://test:pass!%40%24%25%5E%26*()word%3A@www.example.com/database`
      ).password,
      'pass!@$%^&*()word:'
    );
  });

  it('should parse user from URL', () => {
    strict.strictEqual(
      ConnectionConfig.parseUrl(
        String.raw`fml://user%40test.com:pass!%40%24%25%5E%26*()word%3A@www.example.com/database`
      ).user,
      'user@test.com'
    );
  });

  it('should parse IPv6 host from URL', () => {
    strict.strictEqual(
      ConnectionConfig.parseUrl(
        String.raw`fml://test:pass@wordA@fe80%3A3438%3A7667%3A5c77%3Ace27%2518/database`
      ).host,
      'fe80:3438:7667:5c77:ce27%18'
    );
  });

  it('should parse host from URL', () => {
    strict.strictEqual(
      ConnectionConfig.parseUrl(
        String.raw`fml://test:pass@wordA@www.example.com/database`
      ).host,
      'www.example.com'
    );
  });

  it('should parse database from URL', () => {
    strict.strictEqual(
      ConnectionConfig.parseUrl(
        String.raw`fml://test:pass@wordA@www.example.com/database%24`
      ).database,
      'database$'
    );
  });
});

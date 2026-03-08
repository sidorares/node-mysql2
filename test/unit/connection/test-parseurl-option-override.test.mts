import { describe, it, strict } from 'poku';
import ConnectionConfig from '../../../lib/connection_config.js';

describe('parseUrl: DSN Query Parameter Override', () => {
  it('should not allow host override via query params', () => {
    const options = ConnectionConfig.parseUrl(
      'mysql://user:pass@legit.db/app?host=evil.db'
    );

    strict.strictEqual(options.host, 'legit.db');
  });

  it('should not allow user override via query params', () => {
    const options = ConnectionConfig.parseUrl(
      'mysql://user:pass@legit.db/app?user=evil'
    );

    strict.strictEqual(options.user, 'user');
  });

  it('should not allow password override via query params', () => {
    const options = ConnectionConfig.parseUrl(
      'mysql://user:pass@legit.db/app?password=evil'
    );

    strict.strictEqual(options.password, 'pass');
  });

  it('should not allow port override via query params', () => {
    const options = ConnectionConfig.parseUrl(
      'mysql://user:pass@legit.db:3306/app?port=9999'
    );
    strict.strictEqual(options.port, 3306);
  });

  it('should not allow database override via query params', () => {
    const options = ConnectionConfig.parseUrl(
      'mysql://user:pass@legit.db/app?database=evil'
    );
    strict.strictEqual(options.database, 'app');
  });

  it('should still allow safe options via query params', () => {
    const options = ConnectionConfig.parseUrl(
      'mysql://user:pass@legit.db/app?charset=utf8mb4&dateStrings=true'
    );

    // @ts-expect-error: dynamic query param options
    strict.strictEqual(options.charset, 'utf8mb4');
    // @ts-expect-error: dynamic query param options
    strict.strictEqual(options.dateStrings, true);
  });
});

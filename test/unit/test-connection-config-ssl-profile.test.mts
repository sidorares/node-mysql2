import { describe, it, strict } from 'poku';
import ConnectionConfig from '../../lib/connection_config.js';

describe('ConnectionConfig.getSSLProfile', () => {
  it('returns known SSL profiles', () => {
    const profile = ConnectionConfig.getSSLProfile('Amazon RDS');
    strict.equal(typeof profile, 'object');
    strict.ok(profile !== null);
  });

  it('rejects Object.prototype property names as unknown SSL profiles', () => {
    for (const name of ['__proto__', 'constructor', 'toString', 'valueOf']) {
      strict.throws(
        () => ConnectionConfig.getSSLProfile(name),
        new TypeError(`Unknown SSL profile '${name}'`)
      );
    }
  });
});

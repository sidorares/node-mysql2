import { describe, it, strict } from 'poku';
import {
  getAuthPlugin,
  standardAuthPlugins,
} from '../../../lib/commands/auth_switch.js';

await describe('Auth plugin security', async () => {
  await it('standardAuthPlugins should not have prototype', () => {
    // Verify Object.create(null) was used
    strict.equal(
      Object.getPrototypeOf(standardAuthPlugins),
      null,
      'standardAuthPlugins should have null prototype'
    );
  });

  await it('should not resolve prototype properties as plugins', () => {
    const mockConnection = {
      config: {
        authPlugins: {},
      },
    };

    // Try to access prototype property names
    const toStringPlugin = getAuthPlugin('toString', mockConnection);
    const protoPlugin = getAuthPlugin('__proto__', mockConnection);
    const constructorPlugin = getAuthPlugin('constructor', mockConnection);

    strict.equal(
      toStringPlugin,
      undefined,
      'toString should not resolve to a plugin'
    );
    strict.equal(
      protoPlugin,
      undefined,
      '__proto__ should not resolve to a plugin'
    );
    strict.equal(
      constructorPlugin,
      undefined,
      'constructor should not resolve to a plugin'
    );
  });

  await it('should return valid plugins for known auth methods', () => {
    const mockConnection = {
      config: {},
    };

    const nativePlugin = getAuthPlugin('mysql_native_password', mockConnection);
    const sha2Plugin = getAuthPlugin('caching_sha2_password', mockConnection);

    strict.ok(
      typeof nativePlugin === 'function',
      'Should return mysql_native_password plugin'
    );
    strict.ok(
      typeof sha2Plugin === 'function',
      'Should return caching_sha2_password plugin'
    );
  });

  await it('should prioritize custom plugins over standard plugins', () => {
    const customPlugin = () => () => Buffer.from('custom');

    const mockConnection = {
      config: {
        authPlugins: {
          mysql_native_password: customPlugin,
        },
      },
    };

    const plugin = getAuthPlugin('mysql_native_password', mockConnection);

    strict.equal(
      plugin,
      customPlugin,
      'Should return custom plugin instead of standard'
    );
  });

  await it('should use hasOwnProperty check for custom plugins', () => {
    // Mock connection with custom plugins that has a prototype
    const customPlugins = {
      my_custom_plugin: () => () => Buffer.from('custom'),
    };

    const mockConnection = {
      config: {
        authPlugins: customPlugins,
      },
    };

    // This should work for real custom plugins
    const customPlugin = getAuthPlugin('my_custom_plugin', mockConnection);
    strict.ok(typeof customPlugin === 'function', 'Should find custom plugin');

    // This should NOT find prototype properties
    const toStringPlugin = getAuthPlugin('toString', mockConnection);
    strict.equal(
      toStringPlugin,
      undefined,
      'Should not find prototype properties in custom plugins'
    );
  });
});

import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import ClientConstants from '../../../lib/constants/client.js';
import HandshakeResponse from '../../../lib/packets/handshake_response.js';

const baseConfig = {
  user: 'testuser',
  database: 'testdb',
  password: 'testpass',
  flags:
    ClientConstants.LONG_PASSWORD |
    ClientConstants.PLUGIN_AUTH |
    ClientConstants.SECURE_CONNECTION,
  charsetNumber: 255,
  authPluginData1: Buffer.alloc(8),
  authPluginData2: Buffer.alloc(12),
};

await describe('HandshakeResponse with auth plugin name', async () => {
  await it('should accept mysql_native_password', () => {
    const response = new HandshakeResponse({
      ...baseConfig,
      authPluginName: 'mysql_native_password',
      authToken: Buffer.alloc(20),
    });

    strict.equal(response.authPluginName, 'mysql_native_password');
    strict.ok(Buffer.isBuffer(response.authToken));
    strict.equal(response.authToken.length, 20);
  });

  await it('should accept caching_sha2_password', () => {
    const response = new HandshakeResponse({
      ...baseConfig,
      authPluginName: 'caching_sha2_password',
      authToken: Buffer.alloc(32),
    });

    strict.equal(response.authPluginName, 'caching_sha2_password');
    strict.equal(response.authToken.length, 32);
  });

  await it('should accept sha256_password', () => {
    const response = new HandshakeResponse({
      ...baseConfig,
      authPluginName: 'sha256_password',
      authToken: Buffer.from('testpass\0', 'utf8'),
    });

    strict.equal(response.authPluginName, 'sha256_password');
    strict.ok(Buffer.isBuffer(response.authToken));
  });

  await it('should use provided authToken instead of calculating', () => {
    const customToken = Buffer.from('custom_token_data_1234567890');

    const response = new HandshakeResponse({
      ...baseConfig,
      authPluginName: 'caching_sha2_password',
      authToken: customToken,
    });

    strict.equal(response.authToken, customToken);
  });

  await it('should fallback to mysql_native_password when not specified', () => {
    const response = new HandshakeResponse(baseConfig);

    strict.equal(response.authPluginName, 'mysql_native_password');
    strict.ok(Buffer.isBuffer(response.authToken));
  });

  await it('should throw TypeError for non-Buffer authToken', () => {
    let errorThrown = false;
    try {
      new HandshakeResponse({
        ...baseConfig,
        authToken: 'not a buffer' as any,
        authPluginName: 'caching_sha2_password',
      });
    } catch (err: any) {
      if (
        err instanceof TypeError &&
        err.message.includes('must be a Buffer')
      ) {
        errorThrown = true;
      }
    }
    strict.ok(errorThrown, 'Should throw TypeError for non-Buffer authToken');
  });

  await it('should throw TypeError for non-string authPluginName', () => {
    let errorThrown = false;
    try {
      new HandshakeResponse({
        ...baseConfig,
        authToken: Buffer.alloc(32),
        authPluginName: 12345 as any,
      });
    } catch (err: any) {
      if (
        err instanceof TypeError &&
        err.message.includes('must be a string')
      ) {
        errorThrown = true;
      }
    }
    strict.ok(
      errorThrown,
      'Should throw TypeError for non-string authPluginName'
    );
  });

  await it('should handle empty password', () => {
    const response = new HandshakeResponse({
      ...baseConfig,
      password: '',
      authPluginName: 'caching_sha2_password',
      authToken: Buffer.alloc(0),
    });

    strict.equal(response.authToken.length, 0);
  });
});

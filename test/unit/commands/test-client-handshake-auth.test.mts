import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { describe, it, strict } from 'poku';
import ClientHandshake from '../../../lib/commands/client_handshake.js';

await describe('ClientHandshake auth method selection', async () => {
  await describe('calculateSha256Token', async () => {
    const handshake = new ClientHandshake(0);

    await it('should calculate SHA256 token correctly', () => {
      const password = 'testpass';
      const scramble = Buffer.from('12345678901234567890', 'utf8');

      const token = handshake.calculateSha256Token(password, scramble);

      strict.equal(token.length, 32, 'Token should be 32 bytes (SHA256)');
      strict.ok(Buffer.isBuffer(token), 'Token should be a Buffer');
    });

    await it('should return empty buffer for empty password', () => {
      const token = handshake.calculateSha256Token('', Buffer.alloc(20));

      strict.equal(token.length, 0, 'Empty password should return empty buffer');
    });

    await it('should return empty buffer for null password', () => {
      const token = handshake.calculateSha256Token(null as any, Buffer.alloc(20));

      strict.equal(token.length, 0, 'Null password should return empty buffer');
    });

    await it('should return empty buffer for undefined password', () => {
      const token = handshake.calculateSha256Token(
        undefined as any,
        Buffer.alloc(20)
      );

      strict.equal(
        token.length,
        0,
        'Undefined password should return empty buffer'
      );
    });

    await it('should produce different tokens for different passwords', () => {
      const scramble = Buffer.alloc(20);
      const token1 = handshake.calculateSha256Token('password1', scramble);
      const token2 = handshake.calculateSha256Token('password2', scramble);

      strict.notEqual(
        token1.toString('hex'),
        token2.toString('hex'),
        'Different passwords should produce different tokens'
      );
    });

    await it('should produce different tokens for different scrambles', () => {
      const password = 'testpass';
      const scramble1 = Buffer.from('11111111111111111111', 'utf8');
      const scramble2 = Buffer.from('22222222222222222222', 'utf8');

      const token1 = handshake.calculateSha256Token(password, scramble1);
      const token2 = handshake.calculateSha256Token(password, scramble2);

      strict.notEqual(
        token1.toString('hex'),
        token2.toString('hex'),
        'Different scrambles should produce different tokens'
      );
    });

    await it('should match caching_sha2_password plugin algorithm', () => {
      // Reference implementation from lib/auth_plugins/caching_sha2_password.js
      function referenceCalculateToken(
        password: string,
        scramble: Buffer
      ): Buffer {
        if (!password) {
          return Buffer.alloc(0);
        }

        const stage1 = createHash('sha256').update(password, 'utf8').digest();
        const stage2 = createHash('sha256').update(stage1).digest();
        const stage3 = createHash('sha256')
          .update(Buffer.concat([stage2, scramble]))
          .digest();

        const token = Buffer.alloc(stage1.length);
        for (let i = 0; i < stage1.length; i++) {
          token[i] = stage1[i] ^ stage3[i];
        }
        return token;
      }

      const password = 'testpass';
      const scramble = Buffer.from('abcdefghij1234567890', 'utf8');

      const ourToken = handshake.calculateSha256Token(password, scramble);
      const refToken = referenceCalculateToken(password, scramble);

      strict.deepEqual(
        ourToken,
        refToken,
        'Implementation should match reference'
      );
    });

    await it('should handle long passwords', () => {
      const longPassword = 'a'.repeat(1000);
      const scramble = Buffer.alloc(20);

      const token = handshake.calculateSha256Token(longPassword, scramble);

      strict.equal(token.length, 32, 'Token should be 32 bytes for long passwords');
    });

    await it('should handle special characters', () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const scramble = Buffer.alloc(20);

      const token = handshake.calculateSha256Token(specialPassword, scramble);

      strict.equal(token.length, 32, 'Token should be 32 bytes for special characters');
    });

    await it('should handle unicode characters', () => {
      const unicodePassword = '你好世界🌍';
      const scramble = Buffer.alloc(20);

      const token = handshake.calculateSha256Token(unicodePassword, scramble);

      strict.equal(token.length, 32, 'Token should be 32 bytes for unicode');
    });
  });

  await describe('canUseAuthMethodDirectly', async () => {
    const handshake = new ClientHandshake(0);

    await it('should return true for mysql_native_password', () => {
      const result = handshake.canUseAuthMethodDirectly(
        'mysql_native_password',
        false
      );
      strict.equal(result, true, 'mysql_native_password works without SSL');
    });

    await it('should return true for caching_sha2_password', () => {
      const result = handshake.canUseAuthMethodDirectly(
        'caching_sha2_password',
        false
      );
      strict.equal(result, true, 'caching_sha2_password works without SSL');
    });

    await it('should return true for sha256_password with SSL', () => {
      const result = handshake.canUseAuthMethodDirectly(
        'sha256_password',
        true
      );
      strict.equal(result, true, 'sha256_password works with SSL');
    });

    await it('should return false for sha256_password without SSL', () => {
      const result = handshake.canUseAuthMethodDirectly(
        'sha256_password',
        false
      );
      strict.equal(result, false, 'sha256_password needs SSL');
    });

    await it('should return true for mysql_clear_password with SSL', () => {
      const result = handshake.canUseAuthMethodDirectly(
        'mysql_clear_password',
        true
      );
      strict.equal(result, true, 'mysql_clear_password works with SSL');
    });

    await it('should return false for mysql_clear_password without SSL', () => {
      const result = handshake.canUseAuthMethodDirectly(
        'mysql_clear_password',
        false
      );
      strict.equal(result, false, 'mysql_clear_password needs SSL');
    });

    await it('should return false for unknown auth method', () => {
      const result = handshake.canUseAuthMethodDirectly(
        'unknown_method',
        true
      );
      strict.equal(result, false, 'Unknown methods should fallback');
    });
  });
});

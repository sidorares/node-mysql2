import type { SecureContext, SecureContextOptions } from 'node:tls';
import type { SslOptions } from '../../../index.js';
import { constants } from 'node:crypto';
import tls from 'node:tls';
import { describe, it, strict } from 'poku';
import { getSecureContext } from '../../../lib/tls_secure_context.js';

const received: SecureContextOptions[] = [];

tls.createSecureContext = (options?: SecureContextOptions): SecureContext => {
  received.push({ ...options });
  return { context: {} };
};

const contextOptions = {
  ca: 'CA',
  cert: 'CERT',
  ciphers: 'TLS_AES_128_GCM_SHA256',
  crl: 'CRL',
  ecdhCurve: 'P-256',
  key: 'KEY',
  maxVersion: 'TLSv1.3',
  minVersion: 'TLSv1.2',
  passphrase: 'PASSPHRASE',
  pfx: 'PFX',
  secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT,
  sigalgs: 'ECDSA+SHA256',
};

const changedContextOptions = {
  ca: 'CHANGED',
  cert: 'CHANGED',
  ciphers: 'CHANGED',
  crl: 'CHANGED',
  ecdhCurve: 'CHANGED',
  key: 'CHANGED',
  maxVersion: 'CHANGED',
  minVersion: 'CHANGED',
  passphrase: 'CHANGED',
  pfx: 'CHANGED',
  secureOptions: constants.SSL_OP_NO_TICKET,
  sigalgs: 'CHANGED',
};

describe('TLS secure context', () => {
  it('should forward every context option and no connect option', () => {
    const ssl: SslOptions = {
      ...contextOptions,
      rejectUnauthorized: true,
      verifyIdentity: true,
    };

    getSecureContext(ssl);

    strict.deepEqual(received[received.length - 1], contextOptions);
  });

  it('should reuse the context for the same ssl object', () => {
    const ssl: SslOptions = { ...contextOptions };
    const built = received.length;

    strict.equal(getSecureContext(ssl), getSecureContext(ssl));
    strict.equal(received.length, built + 1);
  });

  it('should keep the context when only a connect option changes', () => {
    const ssl: SslOptions = { ...contextOptions, rejectUnauthorized: true };
    const context = getSecureContext(ssl);

    ssl.rejectUnauthorized = false;
    ssl.verifyIdentity = true;

    strict.equal(getSecureContext(ssl), context);
  });

  for (const [name, value] of Object.entries(changedContextOptions)) {
    it(`should rebuild the context when ${name} changes`, () => {
      const ssl: SslOptions = { ...contextOptions };
      const context = getSecureContext(ssl);

      Object.assign(ssl, { [name]: value });
      const rebuilt = getSecureContext(ssl);

      strict.notEqual(rebuilt, context);
      strict.deepEqual(received[received.length - 1], {
        ...contextOptions,
        [name]: value,
      });
      strict.equal(getSecureContext(ssl), rebuilt);
    });
  }
});

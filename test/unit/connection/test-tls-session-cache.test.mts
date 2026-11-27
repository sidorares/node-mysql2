import type { SslOptions } from '../../../index.js';
import { describe, it, strict } from 'poku';
import TlsSessionSlot from '../../../lib/tls_session_cache.js';

type Policy = {
  host?: string;
  port?: number;
  rejectUnauthorized?: boolean;
  verifyIdentity?: boolean;
};

const session = Buffer.from('ticket-1');
const newerSession = Buffer.from('ticket-2');

const slot = (ssl: SslOptions, policy: Policy = {}) =>
  new TlsSessionSlot(
    ssl,
    policy.host ?? 'db.example',
    policy.port ?? 3306,
    policy.rejectUnauthorized ?? true,
    policy.verifyIdentity ?? true
  );

describe('TLS session cache', () => {
  it('should return nothing before a session is stored', () => {
    strict.equal(slot({ ca: 'CA' }).get(), undefined);
  });

  it('should return the stored session for the same ssl object, peer and policy', () => {
    const ssl: SslOptions = { ca: 'CA' };

    slot(ssl).set(session);

    strict.equal(slot(ssl).get(), session);
  });

  it('should keep the newest session', () => {
    const ssl: SslOptions = { ca: 'CA' };

    slot(ssl).set(session);
    slot(ssl).set(newerSession);

    strict.equal(slot(ssl).get(), newerSession);
  });

  it('should separate peers by host and port', () => {
    const ssl: SslOptions = { ca: 'CA' };

    slot(ssl).set(session);

    strict.equal(slot(ssl, { host: 'other.example' }).get(), undefined);
    strict.equal(slot(ssl, { port: 3307 }).get(), undefined);
  });

  it('should never hand a session established under a lax policy to a strict one', () => {
    const ssl: SslOptions = { ca: 'CA' };

    slot(ssl, { rejectUnauthorized: false, verifyIdentity: false }).set(
      session
    );

    strict.equal(
      slot(ssl, { rejectUnauthorized: true, verifyIdentity: false }).get(),
      undefined
    );
    strict.equal(
      slot(ssl, { rejectUnauthorized: true, verifyIdentity: true }).get(),
      undefined
    );

    slot(ssl, { rejectUnauthorized: true, verifyIdentity: false }).set(
      newerSession
    );

    strict.equal(
      slot(ssl, { rejectUnauthorized: true, verifyIdentity: true }).get(),
      undefined
    );
    strict.equal(
      slot(ssl, { rejectUnauthorized: true, verifyIdentity: false }).get(),
      newerSession
    );
  });

  it('should treat a missing verifyIdentity like false', () => {
    const ssl: SslOptions = { ca: 'CA' };

    new TlsSessionSlot(ssl, 'db.example', 3306, true, undefined).set(session);

    strict.equal(slot(ssl, { verifyIdentity: false }).get(), session);
  });

  it('should key on the ssl object identity, not its content', () => {
    slot({ ca: 'CA' }).set(session);

    strict.equal(slot({ ca: 'CA' }).get(), undefined);
  });

  it('should forget every session when the certificate material changes', () => {
    const ssl: SslOptions = { ca: 'CA', minVersion: 'TLSv1.2' };

    slot(ssl).set(session);
    slot(ssl, { host: 'other.example' }).set(session);
    ssl.ca = 'OTHER CA';

    strict.equal(slot(ssl).get(), undefined);
    strict.equal(slot(ssl, { host: 'other.example' }).get(), undefined);

    slot(ssl).set(newerSession);
    ssl.ca = 'CA';

    strict.equal(slot(ssl).get(), undefined);

    slot(ssl).set(session);
    ssl.minVersion = 'TLSv1.3';

    strict.equal(slot(ssl).get(), undefined);
  });

  for (const name of [
    'ca',
    'cert',
    'ciphers',
    'crl',
    'ecdhCurve',
    'key',
    'maxVersion',
    'minVersion',
    'passphrase',
    'pfx',
    'sigalgs',
  ] as const) {
    it(`should forget the session when ${name} changes`, () => {
      const ssl: SslOptions = { ca: 'CA' };

      slot(ssl).set(session);
      ssl[name] = 'CHANGED';

      strict.equal(slot(ssl).get(), undefined);
    });
  }

  it('should keep the session when only a connect option changes', () => {
    const ssl: SslOptions = { ca: 'CA', rejectUnauthorized: true };

    slot(ssl).set(session);
    ssl.rejectUnauthorized = false;
    ssl.verifyIdentity = true;

    strict.equal(slot(ssl).get(), session);
  });

  it('should bind a session to the material and policy of its own handshake', () => {
    const ssl: SslOptions = { ca: 'CA' };
    const handshake = slot(ssl, { rejectUnauthorized: false });

    ssl.ca = 'OTHER CA';
    handshake.set(session);

    strict.equal(slot(ssl, { rejectUnauthorized: false }).get(), undefined);
    strict.equal(slot(ssl, { rejectUnauthorized: true }).get(), undefined);

    ssl.ca = 'CA';
    handshake.set(session);

    strict.equal(slot(ssl, { rejectUnauthorized: true }).get(), undefined);
    strict.equal(slot(ssl, { rejectUnauthorized: false }).get(), session);
  });

  it('should drop a single peer', () => {
    const ssl: SslOptions = { ca: 'CA' };

    slot(ssl).set(session);
    slot(ssl, { host: 'other.example' }).set(session);
    slot(ssl).delete();

    strict.equal(slot(ssl).get(), undefined);
    strict.equal(slot(ssl, { host: 'other.example' }).get(), session);
  });

  it('should tolerate dropping a peer that was never stored', () => {
    slot({ ca: 'CA' }).delete();
  });

  it('should keep at most 100 peers per ssl object', () => {
    const ssl: SslOptions = { ca: 'CA' };

    for (let port = 1; port <= 101; port++) {
      slot(ssl, { port }).set(session);
    }

    strict.equal(slot(ssl, { port: 1 }).get(), undefined);
    strict.equal(slot(ssl, { port: 2 }).get(), session);
    strict.equal(slot(ssl, { port: 101 }).get(), session);
  });
});

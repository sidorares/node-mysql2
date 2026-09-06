'use strict';

const { createLRU } = require('lru.min');

const MAX_PEERS_PER_SSL_CONFIG = 100;

const caches = new WeakMap();

function snapshotMaterial(ssl) {
  return {
    ca: ssl.ca,
    cert: ssl.cert,
    ciphers: ssl.ciphers,
    key: ssl.key,
    passphrase: ssl.passphrase,
    minVersion: ssl.minVersion,
    maxVersion: ssl.maxVersion,
  };
}

function sameMaterial(a, b) {
  return (
    a.ca === b.ca &&
    a.cert === b.cert &&
    a.ciphers === b.ciphers &&
    a.key === b.key &&
    a.passphrase === b.passphrase &&
    a.minVersion === b.minVersion &&
    a.maxVersion === b.maxVersion
  );
}

class TlsSessionSlot {
  constructor(ssl, host, port, rejectUnauthorized, verifyIdentity) {
    this.ssl = ssl;
    this.material = snapshotMaterial(ssl);
    this.key = `${host}:${port}:${Boolean(rejectUnauthorized)}:${Boolean(verifyIdentity)}`;
  }

  _sessions() {
    const cache = caches.get(this.ssl);
    if (cache !== undefined && sameMaterial(cache.material, this.material)) {
      return cache.sessions;
    }
    return undefined;
  }

  get() {
    const sessions = this._sessions();
    return sessions === undefined ? undefined : sessions.get(this.key);
  }

  set(session) {
    let sessions = this._sessions();
    if (sessions === undefined) {
      if (!sameMaterial(this.material, snapshotMaterial(this.ssl))) {
        return;
      }
      sessions = createLRU({ max: MAX_PEERS_PER_SSL_CONFIG });
      caches.set(this.ssl, { material: this.material, sessions });
    }
    sessions.set(this.key, session);
  }

  delete() {
    const sessions = this._sessions();
    if (sessions !== undefined) {
      sessions.delete(this.key);
    }
  }
}

module.exports = TlsSessionSlot;

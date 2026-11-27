'use strict';

const { createLRU } = require('lru.min');
const {
  sameSecureContextOptions,
  snapshotSecureContextOptions,
} = require('./tls_secure_context.js');

const MAX_PEERS_PER_SSL_CONFIG = 100;

const caches = new WeakMap();

class TlsSessionSlot {
  constructor(ssl, host, port, rejectUnauthorized, verifyIdentity) {
    this.ssl = ssl;
    this.material = snapshotSecureContextOptions(ssl);
    this.key = `${host}:${port}:${Boolean(rejectUnauthorized)}:${Boolean(verifyIdentity)}`;
  }

  _sessions() {
    const cache = caches.get(this.ssl);
    if (
      cache !== undefined &&
      sameSecureContextOptions(cache.material, this.material)
    ) {
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
      if (!sameSecureContextOptions(this.material, this.ssl)) {
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

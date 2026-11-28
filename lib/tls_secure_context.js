'use strict';

const Tls = require('tls');

const SECURE_CONTEXT_OPTIONS = Object.freeze([
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
  'secureOptions',
  'sigalgs',
]);

function snapshotSecureContextOptions(ssl) {
  const options = {};
  for (const name of SECURE_CONTEXT_OPTIONS) {
    options[name] = ssl[name];
  }
  return options;
}

function sameSecureContextOptions(a, b) {
  for (const name of SECURE_CONTEXT_OPTIONS) {
    if (a[name] !== b[name]) {
      return false;
    }
  }
  return true;
}

// Building a secure context parses every certificate in the ssl config
// (the bundled AWS profile alone carries over a hundred), which costs
// milliseconds per connection. The context is immutable once built, so
// pooled connections sharing one ssl config object share the context, as
// long as none of the options it was built from has been replaced.
const secureContexts = new WeakMap();

function getSecureContext(ssl) {
  const cached = secureContexts.get(ssl);
  if (cached !== undefined && sameSecureContextOptions(cached.options, ssl)) {
    return cached.secureContext;
  }
  const options = snapshotSecureContextOptions(ssl);
  const secureContext = Tls.createSecureContext(options);
  secureContexts.set(ssl, { options, secureContext });
  return secureContext;
}

module.exports = {
  getSecureContext,
  sameSecureContextOptions,
  snapshotSecureContextOptions,
};

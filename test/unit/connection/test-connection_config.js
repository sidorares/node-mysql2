'use strict';

const ConnectionConfig = require('../../../lib/connection_config');

const assert = require('assert');

const expectedMessage = "SSL profile must be an object, instead it's a boolean";

assert.throws(
  () =>
    new ConnectionConfig({
      ssl: true
    }),
  err => err instanceof TypeError && err.message === expectedMessage,
  'Error, the constructor accepts a boolean without throwing the right exception'
);

assert.doesNotThrow(
  () =>
    new ConnectionConfig({
      ssl: {}
    }),
  'Error, the constructor accepts an object but throws an exception'
);

assert.doesNotThrow(() => {
  const SSLProfiles = require('../../../lib/constants/ssl_profiles.js');
  const sslProfile = Object.keys(SSLProfiles)[0];
  new ConnectionConfig({
    ssl: sslProfile
  });
}, 'Error, the constructor accepts a string but throws an exception');

assert.doesNotThrow(() => {
  new ConnectionConfig({
    flags: '-FOUND_ROWS'
  });
}, 'Error, the constructor threw an exception due to a flags string');

assert.doesNotThrow(() => {
  new ConnectionConfig({
    flags: ['-FOUND_ROWS']
  });
}, 'Error, the constructor threw an exception due to a flags array');

assert.strictEqual(
  ConnectionConfig.parseUrl(
    String.raw`fml://test:pass!@$%^&*()\word:@www.example.com/database`
  ).password,
  'pass!%40$%%5E&*()%5Cword%3A'
);

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
    String.raw`fml://test:pass!%40%24%25%5E%26*()word%3A@www.example.com/database`,
  ).password,
  'pass!@$%^&*()word:',
);

assert.strictEqual(
  ConnectionConfig.parseUrl(
    String.raw`fml://user%40test.com:pass!%40%24%25%5E%26*()word%3A@www.example.com/database`,
  ).user,
  'user@test.com',
);

assert.strictEqual(
  ConnectionConfig.parseUrl(
    String.raw`fml://test:pass@wordA@fe80%3A3438%3A7667%3A5c77%3Ace27%2518/database`,
  ).host,
  'fe80:3438:7667:5c77:ce27%18',
);

assert.strictEqual(
  ConnectionConfig.parseUrl(
    String.raw`fml://test:pass@wordA@www.example.com/database`,
  ).host,
  'www.example.com',
);

assert.strictEqual(
  ConnectionConfig.parseUrl(
    String.raw`fml://test:pass@wordA@www.example.com/database%24`,
  ).database,
  'database$',
);


import { describe, it, strict } from 'poku';
import ConnectionConfig from '../../../lib/connection_config.js';
import ClientConstants from '../../../lib/constants/client.js';

const base = { host: 'localhost', user: 'test' };

const configWith = (options: Record<string, unknown>) =>
  new ConnectionConfig({ ...base, ...options });

const advertisesLocalFiles = (options: Record<string, unknown>) =>
  Boolean(configWith(options).clientFlags & ClientConstants.LOCAL_FILES);

describe('pipelining option: depth', () => {
  it('is off unless requested', () => {
    strict.equal(configWith({}).pipelining, 0);
    strict.equal(configWith({ pipelining: false }).pipelining, 0);
    strict.equal(configWith({ pipelining: null }).pipelining, 0);
    strict.equal(configWith({ pipelining: 0 }).pipelining, 0);
    strict.equal(configWith({ pipelining: 1 }).pipelining, 0);
  });

  it('defaults to 32 commands in flight for true', () => {
    strict.equal(configWith({ pipelining: true }).pipelining, 32);
  });

  it('accepts an integer depth, also as a digit string from a URL', () => {
    strict.equal(configWith({ pipelining: 2 }).pipelining, 2);
    strict.equal(configWith({ pipelining: 64 }).pipelining, 64);
    strict.equal(configWith({ pipelining: '16' }).pipelining, 16);
    strict.equal(
      new ConnectionConfig('mysql://test@localhost/db?pipelining=8').pipelining,
      8
    );
  });

  it('works together with compression', () => {
    strict.equal(configWith({ pipelining: 16, compress: true }).pipelining, 16);
  });

  for (const invalid of [2.5, -1, 'yes', '8 ', '0x10', [4], {}]) {
    it(`rejects ${JSON.stringify(invalid)}`, () => {
      strict.throws(() => configWith({ pipelining: invalid }), TypeError);
    });
  }
});

describe('pipelining option: LOCAL INFILE', () => {
  it('stops advertising LOCAL_FILES when enabled', () => {
    strict.equal(advertisesLocalFiles({}), true);
    strict.equal(advertisesLocalFiles({ pipelining: true }), false);
    strict.equal(advertisesLocalFiles({ pipelining: 1 }), true);
  });

  it('stays off when LOCAL_FILES is requested explicitly', () => {
    const config = configWith({ pipelining: true, flags: ['LOCAL_FILES'] });

    strict.equal(config.pipelining, 0);
    strict.ok(config.clientFlags & ClientConstants.LOCAL_FILES);
  });
});

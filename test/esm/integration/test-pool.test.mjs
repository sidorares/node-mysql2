import { assert, test, describe } from 'poku';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { describeOptions } = require('../../common.test.cjs');
const mysql = require('../../../index.js');

const poolConfig = {}; // config: { connectionConfig: {} };

const pool = mysql.createPool(poolConfig);

describe('Pool methods tests', describeOptions);

assert.equal(pool.escape(123), '123', 'escape method works correctly');

assert.equal(
  pool.escapeId('table name'),
  '`table name`',
  'escapeId method works correctly',
);

test(() => {
  const params = ['table name', 'thing'];
  assert.equal(
    pool.format('SELECT a FROM ?? WHERE b = ?', params),
    "SELECT a FROM `table name` WHERE b = 'thing'",
    'format method works correctly',
  );
});

const poolDotPromise = pool.promise();

describe('Pool.promise() methods tests', describeOptions);

assert.equal(
  poolDotPromise.escape(123),
  '123',
  'promise escape method works correctly',
);

assert.equal(
  poolDotPromise.escapeId('table name'),
  '`table name`',
  'promise escapeId method works correctly',
);

test(() => {
  const params = ['table name', 'thing'];
  assert.equal(
    poolDotPromise.format('SELECT a FROM ?? WHERE b = ?', params),
    "SELECT a FROM `table name` WHERE b = 'thing'",
    'promise format method works correctly',
  );
});

const promisePool = mysql.createPoolPromise(poolConfig);

describe('PromisePool methods tests', describeOptions);

assert.equal(
  promisePool.escape(123),
  '123',
  'PromisePool escape method works correctly',
);

assert.equal(
  promisePool.escapeId('table name'),
  '`table name`',
  'PromisePool escapeId method works correctly',
);

test(() => {
  const params = ['table name', 'thing'];
  assert.equal(
    promisePool.format('SELECT a FROM ?? WHERE b = ?', params),
    "SELECT a FROM `table name` WHERE b = 'thing'",
    'PromisePool format method works correctly',
  );
});

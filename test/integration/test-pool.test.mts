import { describe, it, strict } from 'poku';
import mysql from '../../index.js';

const poolConfig = {}; // config: { connectionConfig: {} };

const pool = mysql.createPool(poolConfig);

describe('Pool methods tests', () => {
  it(() => {
    // @ts-expect-error: TODO: implement typings
    strict.equal(pool.escape(123), '123', 'escape method works correctly');
  });

  it(() => {
    strict.equal(
      // @ts-expect-error: TODO: implement typings
      pool.escapeId('table name'),
      '`table name`',
      'escapeId method works correctly'
    );
  });

  it(() => {
    const params = ['table name', 'thing'];
    strict.equal(
      // @ts-expect-error: TODO: implement typings
      pool.format('SELECT a FROM ?? WHERE b = ?', params),
      "SELECT a FROM `table name` WHERE b = 'thing'",
      'format method works correctly'
    );
  });
});

const poolDotPromise = pool.promise();

describe('Pool.promise() methods tests', () => {
  it(() => {
    strict.equal(
      poolDotPromise.escape(123),
      '123',
      'promise escape method works correctly'
    );
  });

  it(() => {
    strict.equal(
      poolDotPromise.escapeId('table name'),
      '`table name`',
      'promise escapeId method works correctly'
    );
  });

  it(() => {
    const params = ['table name', 'thing'];
    strict.equal(
      poolDotPromise.format('SELECT a FROM ?? WHERE b = ?', params),
      "SELECT a FROM `table name` WHERE b = 'thing'",
      'promise format method works correctly'
    );
  });
});

// @ts-expect-error: TODO: implement typings
const promisePool = mysql.createPoolPromise(poolConfig);

describe('PromisePool methods tests', () => {
  it(() => {
    strict.equal(
      promisePool.escape(123),
      '123',
      'PromisePool escape method works correctly'
    );
  });

  it(() => {
    strict.equal(
      promisePool.escapeId('table name'),
      '`table name`',
      'PromisePool escapeId method works correctly'
    );
  });

  it(() => {
    const params = ['table name', 'thing'];
    strict.equal(
      promisePool.format('SELECT a FROM ?? WHERE b = ?', params),
      "SELECT a FROM `table name` WHERE b = 'thing'",
      'PromisePool format method works correctly'
    );
  });
});

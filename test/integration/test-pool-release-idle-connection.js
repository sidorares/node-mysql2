'use strict';

const createPool = require('../common.js').createPool;
const assert = require('assert');

const pool = new createPool({
  connectionLimit: 5, // 5 connections
  maxIdle: 1, // 1 idle connection
  idleTimeout: 5000, // 5 seconds
});

pool.getConnection((err1, connection1) => {
  assert.ifError(err1);
  assert.ok(connection1);
  pool.getConnection((err2, connection2) => {
    assert.ifError(err2);
    assert.ok(connection2);
    assert.notStrictEqual(connection1, connection2);
    pool.getConnection((err3, connection3) => {
      assert.ifError(err3);
      assert.ok(connection3);
      assert.notStrictEqual(connection1, connection3);
      assert.notStrictEqual(connection2, connection3);
      connection1.release();
      connection2.release();
      connection3.release();
      assert(pool._allConnections.length === 3);
      assert(pool._freeConnections.length === 3);
      setTimeout(() => {
        assert(pool._allConnections.length === 1);
        assert(pool._freeConnections.length === 1);
        pool.getConnection((err4, connection4) => {
          assert.ifError(err4);
          assert.ok(connection4);
          assert.strictEqual(connection3, connection4);
          assert(pool._allConnections.length === 1);
          assert(pool._freeConnections.length === 0);
          connection4.release();
          connection4.destroy();
          pool.end();
        });
      }, 7000);
    });
  });
});

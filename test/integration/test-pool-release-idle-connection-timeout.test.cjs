'use strict';

const createPool = require('../common.test.cjs').createPool;
const { assert } = require('poku');

const pool = new createPool({
  connectionLimit: 3, // 5 connections
  maxIdle: 1, // 1 idle connection
  idleTimeout: 1000, // remove idle connections after 1 second
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
      // after two seconds, the above 3 connection should have been destroyed
      setTimeout(() => {
        assert(pool._allConnections.length === 0);
        assert(pool._freeConnections.length === 0);
        // Creating a new connection should create a fresh one
        pool.getConnection((err4, connection4) => {
          assert.ifError(err4);
          assert.ok(connection4);
          assert(pool._allConnections.length === 1);
          assert(pool._freeConnections.length === 0);
          connection4.release();
          connection4.destroy();
          pool.end();
        });
      }, 2000);
    });
  });
});

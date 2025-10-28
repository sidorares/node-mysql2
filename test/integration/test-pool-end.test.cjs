'use strict';

const { createPool } = require('../common.test.cjs');
const { assert } = require('poku');

const pool = createPool();

pool.getConnection((err, conn) => {
  assert.ifError(err);

  assert(pool._allConnections.length === 1);
  assert(pool._freeConnections.length === 0);

  // emit the end event, so the connection gets removed from the pool
  conn.stream.emit('end');

  assert(pool._allConnections.length === 0);
  assert(pool._freeConnections.length === 0);

  // As the connection has not really ended we need to do this ourselves
  conn.destroy();
});

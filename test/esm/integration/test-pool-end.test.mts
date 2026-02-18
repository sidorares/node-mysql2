import { assert } from 'poku';
import { createPool } from '../common.test.mjs';

const pool = createPool();

pool.getConnection((err, conn) => {
  assert.ifError(err);

  // @ts-expect-error: internal access
  assert(pool._allConnections.length === 1);
  // @ts-expect-error: internal access
  assert(pool._freeConnections.length === 0);

  // emit the end event, so the connection gets removed from the pool
  // @ts-expect-error: internal access
  conn.stream.emit('end');

  // @ts-expect-error: internal access
  assert(pool._allConnections.length === 0);
  // @ts-expect-error: internal access
  assert(pool._freeConnections.length === 0);

  // As the connection has not really ended we need to do this ourselves
  conn.destroy();
});

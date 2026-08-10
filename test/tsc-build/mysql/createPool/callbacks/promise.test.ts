import { mysql } from '../../../index.test.js';
import { access } from '../../baseConnection.test.js';

const pool = mysql.createPool(access);

pool.getConnection((_, connection) => {
  const promiseConnection = connection.promise();

  // `.promise()` resolves to a promise-based PoolConnection
  promiseConnection.release();

  // @ts-expect-error: it is a pooled connection, not a Pool
  promiseConnection.getConnection();
});

import { mysql, mysqlp } from '../../../index.test.js';
import { access } from '../../baseConnection.test.js';

(async () => {
  let pool: mysql.Pool | null = null;
  let promisePool: mysqlp.Pool | null = null;
  let conn: mysqlp.PoolConnection | null = null;

  if (pool === null) return;

  pool = mysql.createPool(access);
  promisePool = pool.promise();
  conn = await promisePool.getConnection();

  conn.release();
})();

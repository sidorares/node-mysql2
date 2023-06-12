import { mysql, mysqlp } from '../../../index';
import { access } from '../../baseConnection';

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

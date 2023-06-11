import { mysql } from '../../../index';
import { access } from '../../baseConnection';

(async () => {
   const pool = mysql.createPool(access);
   const conn = await pool.promise().getConnection();

   pool.releaseConnection(conn);
})();

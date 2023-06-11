import { mysqlp as mysql } from '../../index';
import { access } from '../baseConnection';

(async () => {
  const pool = mysql.createPool(access);
  const conn = await pool.getConnection();

  pool.releaseConnection(conn);
})();

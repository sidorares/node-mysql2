import { mysqlp as mysql } from '../../index.js';
import { access } from '../baseConnection.js';

(async () => {
  const pool = mysql.createPool(access);
  const conn = await pool.getConnection();

  pool.releaseConnection(conn);
})();

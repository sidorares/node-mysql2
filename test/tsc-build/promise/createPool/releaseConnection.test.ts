import { mysqlp as mysql } from '../../index.test.js';
import { access } from '../baseConnection.test.js';

(async () => {
  const pool = mysql.createPool(access);
  const conn = await pool.getConnection();

  pool.releaseConnection(conn);
})();

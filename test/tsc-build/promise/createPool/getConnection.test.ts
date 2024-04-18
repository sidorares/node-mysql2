import { mysqlp as mysql } from '../../index.test.js';
import { access } from '../baseConnection.test.js';

(async () => {
  const pool = mysql.createPool(access);
  const conn = await pool.getConnection();

  conn.connection;

  try {
    // @ts-expect-error: The connection can't get another connection
    conn.getConnection();
  } catch (err) {
    console.log('This error is expected', err);
  }
})();

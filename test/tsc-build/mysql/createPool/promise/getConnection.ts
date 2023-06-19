import { mysql } from '../../../index.js';
import { access } from '../../baseConnection.js';

(async () => {
  const pool = mysql.createPool(access);
  const conn = await pool.promise().getConnection();

  try {
    // @ts-expect-error: The connection can't get another connection
    conn.getConnection();
  } catch (err) {
    console.log('This error is expected', err);
  }
})();

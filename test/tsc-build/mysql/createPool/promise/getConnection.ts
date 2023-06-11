import { mysql } from '../../../index';
import { access } from '../../baseConnection';

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

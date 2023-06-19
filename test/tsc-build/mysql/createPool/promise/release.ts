import { mysql } from '../../../index.js';
import { access } from '../../baseConnection.js';

(async () => {
  const pool = mysql.createPool(access);
  const conn = await pool.promise().getConnection();

  conn.release();

  try {
    // @ts-expect-error: The pool isn't a connection itself, so it doesn't have the connection methods
    pool.release();
  } catch (err) {
    console.log('This error is expected', err);
  }
})();

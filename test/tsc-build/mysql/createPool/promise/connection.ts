import { mysql } from '../../../index.js';
import { access } from '../../baseConnection.js';

(async () => {
  const pool = mysql.createPool(access);
  const conn = await pool.promise().getConnection();

  conn.connection;

  try {
    // @ts-expect-error: The pool can't be a connection itself
    pool.connection;
  } catch (err) {
    console.log('This error is expected', err);
  }
})();

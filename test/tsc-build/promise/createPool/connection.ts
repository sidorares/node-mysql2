import { mysqlp as mysql } from '../../index';
import { access } from '../baseConnection';

(async () => {
  const pool = mysql.createPool(access);
  const conn = await pool.getConnection();

  conn.connection;

  try {
    // @ts-expect-error: The pool can't be a connection itself
    pool.connection;
  } catch (err) {
    console.log('This error is expected', err);
  }
})();

import { mysql } from '../../../index.js';
import { access } from '../../baseConnection.js';

const pool = mysql.createPool(access);

pool.getConnection((_err, conn) => {
  conn.release();

  try {
    // @ts-expect-error: The pool isn't a connection itself, so it doesn't have the connection methods
    pool.release();
  } catch (err) {
    console.log('This error is expected', err);
  }
});

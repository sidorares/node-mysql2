import { mysql } from '../../../index.js';
import { access } from '../../baseConnection.js';

const pool = mysql.createPool(access);

pool.getConnection((_err, conn) => {
  conn.connection;

  try {
    // @ts-expect-error: The pool can't be a connection itself
    pool.connection;
  } catch (err) {
    console.log('This error is expected', err);
  }
});

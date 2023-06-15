import { mysql } from '../../../index.js';
import { access } from '../../baseConnection.js';

const pool = mysql.createPool(access);

pool.getConnection((err, conn) => {
  try {
    // @ts-expect-error: The connection can't get another connection
    conn.getConnection();
  } catch (err) {
    console.log('This error is expected', err);
  }
});

import { mysql } from '../../../index';
import { access } from '../../baseConnection';

const pool = mysql.createPool(access);

pool.getConnection((err, conn) => {
  try {
    // @ts-expect-error: The connection can't get another connection
    conn.getConnection();
  } catch (err) {
    console.log('This error is expected', err);
  }
});

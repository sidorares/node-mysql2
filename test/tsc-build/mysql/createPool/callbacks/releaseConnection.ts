import { mysql } from '../../../index';
import { access } from '../../baseConnection';

const pool = mysql.createPool(access);

pool.getConnection((err, conn) => {
  pool.releaseConnection(conn);
});

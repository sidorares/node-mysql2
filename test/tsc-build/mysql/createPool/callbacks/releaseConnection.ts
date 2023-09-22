import { mysql } from '../../../index.js';
import { access } from '../../baseConnection.js';

const pool = mysql.createPool(access);

pool.getConnection((_err, conn) => {
  pool.releaseConnection(conn);
});

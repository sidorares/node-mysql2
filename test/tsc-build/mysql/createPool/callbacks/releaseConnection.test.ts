import { mysql } from '../../../index.test.js';
import { access } from '../../baseConnection.test.js';

const pool = mysql.createPool(access);

pool.getConnection((_err, conn) => {
  pool.releaseConnection(conn);
});

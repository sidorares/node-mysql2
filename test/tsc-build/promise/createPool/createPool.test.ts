import { mysqlp as mysql } from '../../index.test.js';
import { uriAccess, access } from '../baseConnection.test.js';

(() => {
  let uriPool: mysql.Pool | null = null;
  let pool: mysql.Pool | null = null;

  if (uriPool === null || pool === null) return;

  uriPool = mysql.createPool(uriAccess);
  pool = mysql.createPool(access);
})();

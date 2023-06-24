import { mysql } from '../../../index.js';
import { uriAccess, access } from '../../baseConnection.js';

(() => {
  let uriPool: mysql.Pool | null = null;
  let pool: mysql.Pool | null = null;

  if (uriPool === null || pool === null) return;

  uriPool = mysql.createPool(uriAccess);
  pool = mysql.createPool(access);
})();

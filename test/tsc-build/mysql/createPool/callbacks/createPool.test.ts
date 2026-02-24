import { mysql } from '../../../index.test.js';
import { uriAccess } from '../../baseConnection.test.js';

// createPool(uri) overload is not covered by .mts tests
const pool: mysql.Pool = mysql.createPool(uriAccess);

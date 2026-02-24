import { mysql } from '../../../index.test.js';
import { access } from '../../baseConnection.test.js';

const pool = mysql.createPool(access);

// @ts-expect-error: The pool can't be a connection itself
pool.connection;

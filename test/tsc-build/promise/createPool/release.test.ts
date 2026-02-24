import { mysqlp as mysql } from '../../index.test.js';
import { access } from '../baseConnection.test.js';

const pool = mysql.createPool(access);

// @ts-expect-error: The pool isn't a connection itself, so it doesn't have the connection methods
pool.release();

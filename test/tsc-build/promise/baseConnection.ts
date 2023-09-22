import { mysqlp as mysql } from '../index.js';

export const access: mysql.ConnectionOptions = {
  host: '',
  user: '',
  password: '',
  database: '',
};

export const uriAccess = `mysql://${access.host}:${access.password}@${access.host}:${access.port}/${access.database}`;

/** The SQL for the query */
export const sql = 'SELECT * FROM `table`';

/** The SQL for the query with prepared statements */
export const sqlPS = 'SELECT * FROM `table` WHERE `id` = ?';

/** The values for the query with prepared statements */
export const values = [1];

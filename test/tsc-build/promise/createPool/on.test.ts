import { mysqlp as mysql } from '../../index.test.js';
import { access } from '../baseConnection.test.js';

const pool = mysql.createPool(access);

pool.on('error', (err) => {
  const code: string | undefined = err.code;
  code;
  err.message;
});

pool.on('connection', (connection) => {
  connection.threadId;
});

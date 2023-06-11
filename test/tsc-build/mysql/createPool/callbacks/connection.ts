import { mysql } from '../../../index';
import { access } from '../../baseConnection';

const pool = mysql.createPool(access);

pool.getConnection((err, conn) => {
	conn.connection;
   
   try {
      // @ts-expect-error: The pool can't be a connection itself
      pool.connection;
   } catch (err) {
      console.log('This error is expected', err);
   }
});

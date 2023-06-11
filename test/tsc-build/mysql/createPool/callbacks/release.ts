import { mysql } from '../../../index';
import { access } from '../../baseConnection';

const pool = mysql.createPool(access);

pool.getConnection((err, conn) => {
	conn.release();
	
	try {
		// @ts-expect-error: The pool isn't a connection itself, so it doesn't have the connection methods
		pool.release();
   } catch (err) {
      console.log('This error is expected', err);
   }
});

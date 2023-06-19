import { mysqlp as mysql } from '../../index.js';
import { access, sql, sqlPS, values } from '../baseConnection.js';

(async () => {
  const db = await mysql.createConnection(access);

  {
    /** Overload: query(sql) */
    const [results, fields] = await db.query(sql);
    console.log(results, fields);
  }

  {
    /** Overload: query(sql, values) */
    const [results, fields] = await db.query(sqlPS, values);
    console.log(results, fields);
  }

  {
    /** Overload: query(QueryOptions) I */
    const [results, fields] = await db.query({ sql });
    console.log(results, fields);
  }

  {
    /** Overload: query(QueryOptions) II */
    const [results, fields] = await db.query({ sql: sqlPS, values });
    console.log(results, fields);
  }

  {
    /** Overload: query(QueryOptions, values) */
    const [results, fields] = await db.query({ sql: sqlPS }, values);
    console.log(results, fields);
  }

  await db.end();
})();

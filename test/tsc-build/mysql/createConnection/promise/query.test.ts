import { mysql } from '../../../index.test.js';
import { access, sql, sqlPS, values } from '../../baseConnection.test.js';

(async () => {
  const db = mysql.createConnection(access).promise();

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

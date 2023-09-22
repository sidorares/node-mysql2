import { mysqlp as mysql } from '../../../index.js';
import { access, uriAccess, sql, sqlPS, values } from '../../baseConnection.js';

const poolCluster = mysql.createPoolCluster();

poolCluster.add('cluster1', uriAccess);
poolCluster.add('cluster2', access);

/** execute */
(async () => {
  const conn = poolCluster.of('cluster1');

  {
    /** Overload: execute(sql) */
    const [results, fields] = await conn.execute(sql);
    console.log(results, fields);
  }

  {
    /** Overload: execute(sql, values) */
    const [results, fields] = await conn.execute(sqlPS, values);
    console.log(results, fields);
  }

  {
    /** Overload: execute(QueryOptions) I */
    const [results, fields] = await conn.execute({ sql });
    console.log(results, fields);
  }

  {
    /** Overload: execute(QueryOptions) II */
    const [results, fields] = await conn.execute({ sql: sqlPS, values });
    console.log(results, fields);
  }

  {
    /** Overload: execute(QueryOptions, values) */
    const [results, fields] = await conn.execute({ sql: sqlPS }, values);
    console.log(results, fields);
  }

  /** @ts-expect-error: PoolNamespace can't be a `PoolConnection` */
  conn.release();
})();

/** query */
(async () => {
  const conn = poolCluster.of('cluster2');

  {
    /** Overload: query(sql) */
    const [results, fields] = await conn.query(sql);
    console.log(results, fields);
  }

  {
    /** Overload: query(sql, values) */
    const [results, fields] = await conn.query(sqlPS, values);
    console.log(results, fields);
  }

  {
    /** Overload: query(QueryOptions) I */
    const [results, fields] = await conn.query({ sql });
    console.log(results, fields);
  }

  {
    /** Overload: query(QueryOptions) II */
    const [results, fields] = await conn.query({ sql: sqlPS, values });
    console.log(results, fields);
  }

  {
    /** Overload: query(QueryOptions, values) */
    const [results, fields] = await conn.query({ sql: sqlPS }, values);
    console.log(results, fields);
  }

  /** @ts-expect-error: PoolNamespace can't be a `PoolConnection` */
  conn.release();
})();

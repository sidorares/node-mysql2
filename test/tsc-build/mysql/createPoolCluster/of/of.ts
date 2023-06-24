import { mysql } from '../../../index.js';
import { access, uriAccess, sql, sqlPS, values } from '../../baseConnection.js';

const poolCluster = mysql.createPoolCluster();

poolCluster.add('cluster1', uriAccess);
poolCluster.add('cluster2', access);

/** execute */
{
  const conn = poolCluster.of('cluster1');

  /** Overload: execute(sql, () => {}}) */
  conn.execute(sql, (err, result, fields) => {
    console.log(err, result, fields);
  });

  /** Overload: execute(sql, values, () => {}}) */
  conn.execute(sqlPS, values, (err, result, fields) => {
    console.log(err, result, fields);
  });

  /** Overload: execute(QueryOptions, () => {}}) I */
  conn.execute({ sql }, (err, result, fields) => {
    console.log(err, result, fields);
  });

  /** Overload: execute(QueryOptions, () => {}}) II */
  conn.execute({ sql: sqlPS, values }, (err, result, fields) => {
    console.log(err, result, fields);
  });

  /** Overload: execute(QueryOptions, values, () => {}}) */
  conn.execute({ sql: sqlPS }, values, (err, result, fields) => {
    console.log(err, result, fields);
  });

  /** @ts-expect-error: PoolNamespace can't be a `PoolConnection` */
  conn.release();
}

/** query */
{
  const conn = poolCluster.of('cluster2');

  /** Overload: query(sql, () => {}}) */
  conn.query(sql, (err, result, fields) => {
    console.log(err, result, fields);
  });

  /** Overload: query(sql, values, () => {}}) */
  conn.query(sqlPS, values, (err, result, fields) => {
    console.log(err, result, fields);
  });

  /** Overload: query(QueryOptions, () => {}}) I */
  conn.query({ sql }, (err, result, fields) => {
    console.log(err, result, fields);
  });

  /** Overload: query(QueryOptions, () => {}}) II */
  conn.query({ sql: sqlPS, values }, (err, result, fields) => {
    console.log(err, result, fields);
  });

  /** Overload: query(QueryOptions, values, () => {}}) */
  conn.query({ sql: sqlPS }, values, (err, result, fields) => {
    console.log(err, result, fields);
  });

  /** @ts-expect-error: PoolNamespace can't be a `PoolConnection` */
  conn.release();
}

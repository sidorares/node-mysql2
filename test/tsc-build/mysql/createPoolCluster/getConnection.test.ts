import { mysql } from '../../index.test.js';
import {
  access,
  uriAccess,
  sql,
  sqlPS,
  values,
} from '../baseConnection.test.js';

const poolCluster = mysql.createPoolCluster();

poolCluster.add('cluster1', uriAccess);
poolCluster.add('cluster2', access);

/** execute */
poolCluster.getConnection((_err, conn) => {
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

  /** Checking `PoolConnection` */
  conn.release();
});

/** query */
poolCluster.getConnection('cluster1', (_err, conn) => {
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

  /** Checking `PoolConnection` */
  conn.release();
});

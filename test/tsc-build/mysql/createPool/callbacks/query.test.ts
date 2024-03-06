import { mysql } from '../../../index.test.js';
import { access, sql, sqlPS, values } from '../../baseConnection.test.js';

{
  const db = mysql.createPool(access);

  /** Overload: query(sql, () => {}}) */
  db.query(sql, (err, result, fields) => {
    console.log(err, result, fields);
  });

  /** Overload: query(sql, values, () => {}}) */
  db.query(sqlPS, values, (err, result, fields) => {
    console.log(err, result, fields);
  });

  /** Overload: query(QueryOptions, () => {}}) I */
  db.query({ sql }, (err, result, fields) => {
    console.log(err, result, fields);
  });

  /** Overload: query(QueryOptions, () => {}}) II */
  db.query({ sql: sqlPS, values }, (err, result, fields) => {
    console.log(err, result, fields);
  });

  /** Overload: query(QueryOptions, values, () => {}}) */
  db.query({ sql: sqlPS }, values, (err, result, fields) => {
    console.log(err, result, fields);
  });
}

/** getConnection */
{
  mysql.createPool(access).getConnection((_err, connection) => {
    /** Overload: query(sql, () => {}}) */
    connection.query(sql, (err, result, fields) => {
      console.log(err, result, fields);
    });

    /** Overload: query(sql, values, () => {}}) */
    connection.query(sqlPS, values, (err, result, fields) => {
      console.log(err, result, fields);
    });

    /** Overload: query(QueryOptions, () => {}}) I */
    connection.query({ sql }, (err, result, fields) => {
      console.log(err, result, fields);
    });

    /** Overload: query(QueryOptions, () => {}}) II */
    connection.query({ sql: sqlPS, values }, (err, result, fields) => {
      console.log(err, result, fields);
    });

    /** Overload: query(QueryOptions, values, () => {}}) */
    connection.query({ sql: sqlPS }, values, (err, result, fields) => {
      console.log(err, result, fields);
    });
  });
}

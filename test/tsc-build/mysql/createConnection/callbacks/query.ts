import { mysql } from '../../../index';
import { access, sql, sqlPS, values } from '../../baseConnection';

{
  const db = mysql.createConnection(access);

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

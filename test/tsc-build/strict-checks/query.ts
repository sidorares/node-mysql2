/**
 * This test strictly validates each overload and its corresponding returned types.
 * For `query` syntax tests, please use the '../mysql' and '../promise'.
 */

import { mysql, mysqlp } from '../index.js';
import { access, sql } from '../promise/baseConnection.js';

// Callbacks
{
  const conn = mysql.createConnection(access);

  conn.query<mysql.RowDataPacket[]>(sql, (_e, _r, _f) => {
    const err: mysql.QueryError | null = _e;
    const result: mysql.RowDataPacket[] = _r;
    const fields: mysql.FieldPacket[] = _f;

    console.log(err, result, fields);
  });

  conn.query<mysql.RowDataPacket[][]>(sql, (_e, _r, _f) => {
    const err: mysql.QueryError | null = _e;
    const result: mysql.RowDataPacket[][] = _r;
    const fields: mysql.FieldPacket[] = _f;

    console.log(err, result, fields);
  });

  conn.query<mysql.OkPacket>(sql, (_e, _r, _f) => {
    const err: mysql.QueryError | null = _e;
    const result: mysql.OkPacket = _r;
    const fields: mysql.FieldPacket[] = _f;

    console.log(err, result, fields);
  });

  conn.query<mysql.OkPacket[]>(sql, (_e, _r, _f) => {
    const err: mysql.QueryError | null = _e;
    const result: mysql.OkPacket[] = _r;
    const fields: mysql.FieldPacket[] = _f;

    console.log(err, result, fields);
  });

  conn.query<mysql.ResultSetHeader>(sql, (_e, _r, _f) => {
    const err: mysql.QueryError | null = _e;
    const result: mysql.ResultSetHeader = _r;
    const fields: mysql.FieldPacket[] = _f;

    console.log(err, result, fields);
  });

  conn.query<mysql.ProcedureCallPacket>(sql, (_e, _r, _f) => {
    const err: mysql.QueryError | null = _e;
    const result:
      | [mysqlp.RowDataPacket[], mysqlp.ResultSetHeader]
      | mysqlp.ResultSetHeader = _r;
    const fields: mysql.FieldPacket[] = _f;

    console.log(err, result, fields);
  });

  conn.query<mysql.ProcedureCallPacket<mysql.RowDataPacket[]>>(
    sql,
    (_e, _r, _f) => {
      const err: mysql.QueryError | null = _e;
      const result: [mysqlp.RowDataPacket[], mysql.ResultSetHeader] = _r;
      const fields: mysql.FieldPacket[] = _f;

      console.log(err, result, fields);
    },
  );

  conn.query<mysql.ProcedureCallPacket<mysql.OkPacket | mysql.ResultSetHeader>>(
    sql,
    (_e, _r, _f) => {
      const err: mysql.QueryError | null = _e;
      const result: mysql.ResultSetHeader = _r;
      const fields: mysql.FieldPacket[] = _f;

      console.log(err, result, fields);
    },
  );
}

// Promise
(async () => {
  const conn = await mysqlp.createConnection(access);

  conn.query<mysqlp.RowDataPacket[]>(sql).then(([_r, _f]) => {
    const result: mysqlp.RowDataPacket[] = _r;
    const fields: mysqlp.FieldPacket[] = _f;

    console.log(result, fields);
  });

  conn.query<mysqlp.RowDataPacket[][]>(sql).then(([_r, _f]) => {
    const result: mysqlp.RowDataPacket[][] = _r;
    const fields: mysqlp.FieldPacket[] = _f;

    console.log(result, fields);
  });

  conn.query<mysqlp.OkPacket>(sql).then(([_r, _f]) => {
    const result: mysqlp.OkPacket = _r;
    const fields: mysqlp.FieldPacket[] = _f;

    console.log(result, fields);
  });

  conn.query<mysqlp.OkPacket[]>(sql).then(([_r, _f]) => {
    const result: mysqlp.OkPacket[] = _r;
    const fields: mysqlp.FieldPacket[] = _f;

    console.log(result, fields);
  });

  conn.query<mysqlp.ResultSetHeader>(sql).then(([_r, _f]) => {
    const result: mysqlp.ResultSetHeader = _r;
    const fields: mysqlp.FieldPacket[] = _f;

    console.log(result, fields);
  });

  conn.query<mysqlp.ProcedureCallPacket>(sql).then(([_r, _f]) => {
    const result:
      | [mysqlp.RowDataPacket[], mysqlp.ResultSetHeader]
      | mysqlp.ResultSetHeader = _r;
    const fields: mysqlp.FieldPacket[] = _f;

    console.log(result, fields);
  });

  conn
    .query<mysqlp.ProcedureCallPacket<mysqlp.RowDataPacket[]>>(sql)
    .then(([_r, _f]) => {
      const result: [mysqlp.RowDataPacket[], mysql.ResultSetHeader] = _r;
      const fields: mysqlp.FieldPacket[] = _f;

      console.log(result, fields);
    });

  conn
    .query<
      mysqlp.ProcedureCallPacket<mysqlp.OkPacket | mysqlp.ResultSetHeader>
    >(sql)
    .then(([_r, _f]) => {
      const result: mysqlp.ResultSetHeader = _r;
      const fields: mysqlp.FieldPacket[] = _f;

      console.log(result, fields);
    });
})();

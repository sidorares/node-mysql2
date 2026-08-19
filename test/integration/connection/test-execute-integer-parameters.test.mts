import type { ResultSetHeader, RowDataPacket } from '../../../promise.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

// Every JS number is sent as MYSQL_TYPE_DOUBLE. MySQL refuses a DOUBLE where a
// statement needs an integer, and since 8.0.22 it no longer re-prepares when a
// later execution changes the parameter type, so the first type a cached
// statement sees decides how every later execution is read.
//
// https://github.com/sidorares/node-mysql2/issues/1239
// https://github.com/sidorares/node-mysql2/pull/1407

await describe('Integer parameters: placeholders that require an integer type', async () => {
  const connection = createConnection().promise();

  await connection.query(
    'CREATE TEMPORARY TABLE int_param_limit (id INT PRIMARY KEY)'
  );
  await connection.query(
    'INSERT INTO int_param_limit VALUES (1), (2), (3), (4)'
  );

  await it('accepts a number for LIMIT', async () => {
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM int_param_limit ORDER BY id LIMIT ?',
      [2]
    );

    strict.deepEqual(
      rows.map((row) => row.id),
      [1, 2]
    );
  });

  await it('accepts numbers for LIMIT and OFFSET', async () => {
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM int_param_limit ORDER BY id LIMIT ? OFFSET ?',
      [2, 2]
    );

    strict.deepEqual(
      rows.map((row) => row.id),
      [3, 4]
    );
  });

  await connection.end();
});

await describe('Integer parameters: a cached statement keeps its precision', async () => {
  const connection = createConnection().promise();

  await connection.query(
    `CREATE TEMPORARY TABLE int_param_wide (
      id INT AUTO_INCREMENT PRIMARY KEY,
      wide BIGINT
    )`
  );

  const insert = async (value: string | number) => {
    const [result] = await connection.execute<ResultSetHeader>(
      'INSERT INTO int_param_wide (wide) VALUES (?)',
      [value]
    );
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT CAST(wide AS CHAR) AS text FROM int_param_wide WHERE id = ?',
      [result.insertId]
    );
    return rows[0].text;
  };

  // The first execution binds a number. Without an integer type on the wire the
  // statement is fixed as DOUBLE, and the exact string that follows is read back
  // through that DOUBLE and silently rounded.
  await it('does not round a later value to the first one it saw', async () => {
    strict.equal(await insert(1), '1');
    strict.equal(await insert('9007199254740993'), '9007199254740993');
  });

  await connection.end();
});

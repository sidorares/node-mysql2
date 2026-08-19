import type { RowDataPacket } from '../../../promise.js';
import { describe, it, strict } from 'poku';
import mysql from '../../../index.js';
import { createConnection } from '../../common.test.mjs';

const { Types } = mysql;

// COM_STMT_PREPARE reports a type for every `?`. The driver adopts it only for
// integer positions holding integer values; these tests pin down both what the
// servers report and where the driver deliberately ignores it.
//
// https://github.com/sidorares/node-mysql2/issues/1239
const hintOf = async (
  // @ts-expect-error: TODO: implement typings
  connection,
  sql: string
) => {
  connection.connection.unprepare(sql);
  const statement = (await connection.prepare(sql)).statement;
  return statement.parameters[0];
};

await describe('PREPARE hints: what the server actually reports', async () => {
  const connection = createConnection().promise();

  await connection.query(
    `CREATE TEMPORARY TABLE hint_src (
      id INT PRIMARY KEY,
      num INT,
      text VARCHAR(32),
      big BIGINT UNSIGNED
    )`
  );

  // Only MySQL 8.0 and later resolve parameter types. MySQL 5.7 answers
  // VAR_STRING with a zero length for every parameter and MariaDB answers
  // MYSQL_TYPE_NULL, both of which carry no information at all.
  const numeric = await hintOf(
    connection,
    'SELECT id FROM hint_src WHERE num = ?'
  );
  const reportsTypes = numeric.columnType === Types.LONGLONG;

  await it('either resolves a parameter type or reports a placeholder', () => {
    strict.ok(
      reportsTypes ||
        numeric.columnType === Types.NULL ||
        (numeric.columnType === Types.VAR_STRING && numeric.columnLength === 0),
      `unexpected placeholder type ${numeric.columnType}`
    );
  });

  await it('carries the unsigned flag MySQL2 cannot otherwise know', async () => {
    const unsigned = await hintOf(
      connection,
      'SELECT id FROM hint_src WHERE big = ?'
    );

    strict.equal(Boolean(unsigned.flags & 32), reportsTypes);
  });

  // The reason the hint cannot simply become the default for every parameter: a
  // parameter definition carries no provenance, so "VAR_STRING because the
  // column is VARCHAR" and "VAR_STRING because the server had no idea" are
  // indistinguishable.
  await it('cannot say whether a hint came from a column or from nothing', async () => {
    const fromColumn = await hintOf(
      connection,
      'SELECT id FROM hint_src WHERE text = ?'
    );
    const fromNothing = await hintOf(connection, 'SELECT ? AS anything');

    strict.equal(fromColumn.columnType, fromNothing.columnType);
    strict.equal(fromColumn.table, fromNothing.table);
    strict.equal(fromColumn.orgName, fromNothing.orgName);
  });

  await connection.end();
});

await describe('PREPARE hints: the driver adopts integer hints only', async () => {
  const connection = createConnection().promise();

  await connection.query(
    'CREATE TEMPORARY TABLE hint_use (id INT PRIMARY KEY, num INT)'
  );
  await connection.query('INSERT INTO hint_use VALUES (1, 7), (2, 8)');

  await it('adopts an integer hint so LIMIT accepts a number', async () => {
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM hint_use ORDER BY id LIMIT ?',
      [1]
    );

    strict.equal(rows.length, 1);
  });

  // Gate one. A VAR_STRING hint is indistinguishable from "no idea", so it is
  // never adopted: a bare placeholder still round-trips a number as a number.
  await it('ignores a non-integer hint', async () => {
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT ? AS value',
      [42]
    );

    strict.equal(typeof rows[0].value, 'number');
    strict.equal(rows[0].value, 42);
  });

  // Gate two. The value has to be an integer already, otherwise the server's
  // own coercion is left in place rather than turned into a client-side error.
  await it('ignores an integer hint for a value that is not an integer', async () => {
    const [coerced] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM hint_use WHERE num = ?',
      ['7abc']
    );
    strict.equal(coerced.length, 1);

    const [fractional] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM hint_use WHERE num = ?',
      [1.5]
    );
    strict.equal(fractional.length, 0);
  });

  await connection.end();
});

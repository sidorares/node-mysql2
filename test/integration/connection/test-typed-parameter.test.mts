import type {
  ExecuteValues,
  ResultSetHeader,
  RowDataPacket,
} from '../../../promise.js';
import { describe, it, strict } from 'poku';
import mysql from '../../../index.js';
import { createConnection } from '../../common.test.mjs';

const { TypedParameter } = mysql;

// https://github.com/sidorares/node-mysql2/issues/1239
await describe('TypedParameter: integer placeholders the server refuses as DOUBLE', async () => {
  const connection = createConnection().promise();

  await connection.query(
    'CREATE TEMPORARY TABLE tp_limit (id INT PRIMARY KEY)'
  );
  await connection.query('INSERT INTO tp_limit VALUES (1), (2), (3), (4)');

  await it('accepts a typed integer for LIMIT', async () => {
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM tp_limit ORDER BY id LIMIT ?',
      [TypedParameter.BIGINT(2)]
    );

    strict.deepEqual(
      rows.map((row) => row.id),
      [1, 2]
    );
  });

  await it('accepts typed integers for LIMIT and OFFSET', async () => {
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM tp_limit ORDER BY id LIMIT ? OFFSET ?',
      [TypedParameter.BIGINT(2), TypedParameter.BIGINT(2)]
    );

    strict.deepEqual(
      rows.map((row) => row.id),
      [3, 4]
    );
  });

  await connection.end();
});

await describe('TypedParameter: values JS numbers cannot carry', async () => {
  const connection = createConnection().promise();

  await connection.query(
    `CREATE TEMPORARY TABLE tp_wide (
      id INT AUTO_INCREMENT PRIMARY KEY,
      wide_signed BIGINT NULL,
      wide_unsigned BIGINT UNSIGNED NULL
    )`
  );

  const insert = async (column: string, value: ExecuteValues) => {
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO tp_wide (${column}) VALUES (?)`,
      [value]
    );
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT CAST(${column} AS CHAR) AS text FROM tp_wide WHERE id = ?`,
      [result.insertId]
    );
    return rows[0].text;
  };

  await it('keeps a BIGINT beyond 2^53 exact', async () => {
    strict.equal(
      await insert('wide_signed', TypedParameter.BIGINT('9007199254740993')),
      '9007199254740993'
    );
  });

  await it('keeps the largest unsigned BIGINT exact', async () => {
    strict.equal(
      await insert(
        'wide_unsigned',
        TypedParameter.BIGINT.unsigned('18446744073709551615')
      ),
      '18446744073709551615'
    );
  });

  await it('keeps the smallest signed BIGINT exact', async () => {
    strict.equal(
      await insert('wide_signed', TypedParameter.BIGINT(-9223372036854775808n)),
      '-9223372036854775808'
    );
  });

  await it('stores a typed null', async () => {
    strict.equal(
      await insert('wide_signed', TypedParameter.BIGINT(null)),
      null
    );
  });

  await connection.end();
});

await describe('TypedParameter: overriding the inferred type', async () => {
  const connection = createConnection().promise();

  await connection.query(
    `CREATE TEMPORARY TABLE tp_shapes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      raw VARBINARY(16) NULL,
      label VARCHAR(32) NULL
    )`
  );

  await it('sends a Buffer as binary rather than charset text', async () => {
    const [result] = await connection.execute<ResultSetHeader>(
      'INSERT INTO tp_shapes (raw) VALUES (?)',
      [TypedParameter.BLOB(Buffer.from([0xc3, 0x28]))]
    );
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT HEX(raw) AS hex FROM tp_shapes WHERE id = ?',
      [result.insertId]
    );

    strict.equal(rows[0].hex, 'C328');
  });

  await it('sends a number as a string when asked to', async () => {
    const [result] = await connection.execute<ResultSetHeader>(
      'INSERT INTO tp_shapes (label) VALUES (?)',
      [TypedParameter.VARCHAR(42)]
    );
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT label FROM tp_shapes WHERE id = ?',
      [result.insertId]
    );

    strict.equal(rows[0].label, '42');
  });

  await connection.end();
});

describe('TypedParameter: a mistyped value fails at the call site', () => {
  it('rejects an out-of-range integer', () => {
    strict.throws(() => TypedParameter.TINY(128));
  });

  it('rejects a number that has already lost precision', () => {
    strict.throws(() => TypedParameter.BIGINT(Number.MAX_SAFE_INTEGER + 2));
  });

  it('rejects a value that is not an integer at all', () => {
    strict.throws(() => TypedParameter.INT('7abc'));
  });
});

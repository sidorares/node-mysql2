import type { ExecuteValues, RowDataPacket } from '../../../promise.js';
import { describe, it, strict } from 'poku';
import mysql from '../../../index.js';
import { createConnection } from '../../common.test.mjs';

const { TypedParameter } = mysql;

const ROWS = 2000;

// Binding a number against an indexed string column makes the server compare
// the column as a number, which cannot use the index. Because a cached
// statement keeps the first type it saw, one such execution degrades every
// later one on MySQL. A TypedParameter pins the position to one wire type, so
// the index lookup survives a mixed sequence of JavaScript values.
await describe('TypedParameter: keeps a cached statement on its index', async () => {
  const connection = createConnection().promise();

  await connection.query(
    `CREATE TEMPORARY TABLE tp_plan (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(16),
      KEY code (code)
    )`
  );

  const values = Array.from(
    { length: ROWS },
    (_, index) => `('${String(index).padStart(6, '0')}')`
  ).join(',');
  await connection.query(`INSERT INTO tp_plan (code) VALUES ${values}`);

  const rowsScanned = async (value: ExecuteValues) => {
    const [before] = await connection.query<RowDataPacket[]>(
      "SHOW SESSION STATUS LIKE 'Handler_read_next'"
    );
    await connection.execute('SELECT id FROM tp_plan WHERE code = ?', [value]);
    const [after] = await connection.query<RowDataPacket[]>(
      "SHOW SESSION STATUS LIKE 'Handler_read_next'"
    );

    return Number(after[0].Value) - Number(before[0].Value);
  };

  await it('reads one row per lookup when every binding is typed', async () => {
    const typed = TypedParameter.VARCHAR('001000');

    strict.equal(await rowsScanned(typed), 1);
    await rowsScanned(TypedParameter.VARCHAR(1000));
    strict.equal(await rowsScanned(typed), 1);
    await rowsScanned(TypedParameter.VARCHAR(1000n));
    strict.equal(await rowsScanned(typed), 1);
  });

  await connection.end();
});

await describe('TypedParameter: an untyped number still scans', async () => {
  const connection = createConnection().promise();

  await connection.query(
    `CREATE TEMPORARY TABLE tp_scan (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(16),
      KEY code (code)
    )`
  );
  const values = Array.from(
    { length: ROWS },
    (_, index) => `('${String(index).padStart(6, '0')}')`
  ).join(',');
  await connection.query(`INSERT INTO tp_scan (code) VALUES ${values}`);

  // Documents the cost a caller avoids by reaching for a container: comparing a
  // string column against a number is a whole-index scan on both servers.
  await it('scans the index when a number is compared to a string column', async () => {
    const [before] = await connection.query<RowDataPacket[]>(
      "SHOW SESSION STATUS LIKE 'Handler_read_next'"
    );
    await connection.execute('SELECT id FROM tp_scan WHERE code = ?', [1000]);
    const [after] = await connection.query<RowDataPacket[]>(
      "SHOW SESSION STATUS LIKE 'Handler_read_next'"
    );

    strict.equal(Number(after[0].Value) - Number(before[0].Value), ROWS);
  });

  await connection.end();
});

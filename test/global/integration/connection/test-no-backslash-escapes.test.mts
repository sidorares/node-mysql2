import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { describe, it, skip, strict } from 'poku';
import mysql from '../../../../index.js';
import { createConnection, createPool } from '../../../common.test.mjs';

type ValueRow = RowDataPacket & { value: string };

if (`${process.env.MYSQL_CONNECTION_URL}`.includes('pscale_pw_')) {
  skip('PlanetScale does not support SET GLOBAL');
}

const value = "C:\\dir\\ it's";
const breakout = "\\' AS v, 12345 AS x -- ";
const setNoBackslashEscapes = "SET SESSION sql_mode = 'NO_BACKSLASH_ESCAPES'";

const columnsOf = (rows: RowDataPacket[]) => Object.keys(rows[0]);
const failureOf = (error: { code?: string }) => [`query failed: ${error.code}`];

await describe('NO_BACKSLASH_ESCAPES in the global SQL mode', async () => {
  const admin = createConnection().promise();
  const [savedRows] = await admin.query<RowDataPacket[]>(
    'SELECT @@GLOBAL.sql_mode AS backup'
  );
  const originalSqlMode = savedRows[0].backup;

  await admin.query(
    "SET GLOBAL sql_mode = CONCAT(@@GLOBAL.sql_mode, ',NO_BACKSLASH_ESCAPES')"
  );

  await describe('a query sent before the handshake', async () => {
    const connection = createConnection().promise();
    const select = connection.query<ValueRow[]>('SELECT ? AS value', [value]);

    await it('should keep the value as it was', async () => {
      const [rows] = await select;

      strict.equal(rows[0].value, value);
    });

    await connection.end();
  });

  await describe('a change of user', async () => {
    const connection = createConnection().promise();

    await it('should keep a value as it was in the mode it restores', async () => {
      await connection.query("SET SESSION sql_mode = ''");
      await connection.changeUser({});
      const [rows] = await connection.query<ValueRow[]>('SELECT ? AS value', [
        value,
      ]);

      strict.equal(rows[0].value, value);
    });

    await connection.end();
  });

  await admin.query('SET GLOBAL sql_mode = ?', [originalSqlMode]);
  await admin.end();
});

await describe('a value escaped for a mode the session is not in', async () => {
  const admin = createConnection().promise();

  await admin.query('DROP PROCEDURE IF EXISTS mode_mismatch_sets_nbe');
  await admin.query('DROP PROCEDURE IF EXISTS mode_mismatch_sets_default');
  await admin.query(
    `CREATE PROCEDURE mode_mismatch_sets_nbe() BEGIN ${setNoBackslashEscapes}; SELECT 1; END`
  );
  await admin.query(
    'CREATE PROCEDURE mode_mismatch_sets_default() BEGIN SET SESSION sql_mode = DEFAULT; SELECT 1; END'
  );

  await describe('the module-level format() in a session that ignores backslashes', async () => {
    const connection = createConnection().promise();

    await connection.query(setNoBackslashEscapes);
    const columns = await connection
      .query<RowDataPacket[]>(mysql.format('SELECT ? AS v', [breakout]))
      .then(([rows]) => columnsOf(rows), failureOf);

    it('should keep the value inside its string literal', () => {
      strict.deepEqual(columns, ['v']);
    });

    await connection.end();
  });

  await describe('pool.escape() in a session that ignores backslashes', async () => {
    const pool = createPool({ connectionLimit: 1 }).promise();

    await pool.query(setNoBackslashEscapes);
    const columns = await pool
      .query<RowDataPacket[]>(`SELECT ${pool.escape(breakout)} AS v`)
      .then(([rows]) => columnsOf(rows), failureOf);

    it('should keep the value inside its string literal', () => {
      strict.deepEqual(columns, ['v']);
    });

    await pool.end();
  });

  await describe('a value bound after a mode change in the same multiple-statement query', async () => {
    const connection = createConnection({
      multipleStatements: true,
    }).promise();
    const columns = await connection
      .query<RowDataPacket[][]>(`${setNoBackslashEscapes}; SELECT ? AS v`, [
        breakout,
      ])
      .then(([results]) => columnsOf(results[1]), failureOf);

    it('should keep the value inside its string literal', () => {
      strict.deepEqual(columns, ['v']);
    });

    await connection.end();
  });

  await describe('a value bound after a routine left its own mode in the status flag', async () => {
    const connection = createConnection().promise();

    await connection.query('CALL mode_mismatch_sets_nbe()');
    const columns = await connection
      .query<RowDataPacket[]>('SELECT ? AS v', [breakout])
      .then(([rows]) => columnsOf(rows), failureOf);

    it('should keep the value inside its string literal', () => {
      strict.deepEqual(columns, ['v']);
    });

    await connection.end();
  });

  await describe('a value bound after a routine restored the default inside a session that ignores backslashes', async () => {
    const connection = createConnection().promise();

    await connection.query(setNoBackslashEscapes);
    await connection.query('CALL mode_mismatch_sets_default()');
    const columns = await connection
      .query<RowDataPacket[]>('SELECT ? AS v', [breakout])
      .then(([rows]) => columnsOf(rows), failureOf);

    it('should keep the value inside its string literal', () => {
      strict.deepEqual(columns, ['v']);
    });

    await connection.end();
  });

  await admin.query('DROP PROCEDURE IF EXISTS mode_mismatch_sets_nbe');
  await admin.query('DROP PROCEDURE IF EXISTS mode_mismatch_sets_default');
  await admin.end();
});

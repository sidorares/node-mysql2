import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type DateRow = RowDataPacket & { d: Date };
type SqlModeRow = RowDataPacket & { value: string };

await describe('Regression #1019 — readDateTime zero date with numeric timezone offset', async () => {
  const strictModes = ['NO_ZERO_DATE', 'NO_ZERO_IN_DATE'];

  await it('should return Invalid Date for zero date via execute with numeric timezone', async () => {
    const connection = createConnection({ timezone: '+00:00' });

    const modeRows = await new Promise<SqlModeRow[]>((resolve, reject) => {
      connection.query<SqlModeRow[]>(
        'SELECT variable_value as value FROM performance_schema.session_variables where variable_name = ?',
        ['sql_mode'],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });

    const relaxedMode = modeRows[0].value
      .split(',')
      .filter((mode) => strictModes.indexOf(mode) === -1)
      .join(',');

    await new Promise<void>((resolve, reject) => {
      connection.query(`SET sql_mode=?`, [relaxedMode], (err) =>
        err ? reject(err) : resolve()
      );
    });

    await new Promise<void>((resolve, reject) => {
      connection.query('CREATE TEMPORARY TABLE t1019 (d DATETIME)', (err) =>
        err ? reject(err) : resolve()
      );
    });

    await new Promise<void>((resolve, reject) => {
      connection.query(
        "INSERT INTO t1019 VALUES ('0000-00-00 00:00:00'), ('2023-06-15 10:30:45')",
        (err) => (err ? reject(err) : resolve())
      );
    });

    const rows = await new Promise<DateRow[]>((resolve, reject) => {
      connection.execute<DateRow[]>(
        'SELECT d FROM t1019 ORDER BY d ASC',
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });

    strict.equal(rows.length, 2);

    strict(rows[0].d instanceof Date, 'zero date should be a Date instance');
    strict(isNaN(rows[0].d.getTime()), 'zero date should be Invalid Date');

    strict(rows[1].d instanceof Date, 'valid date should be a Date instance');
    strict(
      !isNaN(rows[1].d.getTime()),
      'valid date should not be Invalid Date'
    );

    connection.end();
  });

  await it('should return Invalid Date for zero date via execute with negative timezone offset', async () => {
    const connection = createConnection({ timezone: '-05:00' });

    const modeRows = await new Promise<SqlModeRow[]>((resolve, reject) => {
      connection.query<SqlModeRow[]>(
        'SELECT variable_value as value FROM performance_schema.session_variables where variable_name = ?',
        ['sql_mode'],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });

    const relaxedMode = modeRows[0].value
      .split(',')
      .filter((mode) => strictModes.indexOf(mode) === -1)
      .join(',');

    await new Promise<void>((resolve, reject) => {
      connection.query(`SET sql_mode=?`, [relaxedMode], (err) =>
        err ? reject(err) : resolve()
      );
    });

    await new Promise<void>((resolve, reject) => {
      connection.query(
        'CREATE TEMPORARY TABLE t1019b (d DATE DEFAULT NULL)',
        (err) => (err ? reject(err) : resolve())
      );
    });

    await new Promise<void>((resolve, reject) => {
      connection.query("INSERT INTO t1019b VALUES ('0000-00-00')", (err) =>
        err ? reject(err) : resolve()
      );
    });

    const rows = await new Promise<DateRow[]>((resolve, reject) => {
      connection.execute<DateRow[]>('SELECT d FROM t1019b', (err, rows) =>
        err ? reject(err) : resolve(rows)
      );
    });

    strict.equal(rows.length, 1);
    strict(rows[0].d instanceof Date, 'zero date should be a Date instance');
    strict(isNaN(rows[0].d.getTime()), 'zero date should be Invalid Date');

    connection.end();
  });
});

import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('dateStrings: binary protocol keeps the 00:00:00 time of DATETIME/TIMESTAMP', async () => {
  const connection = createConnection({ dateStrings: true }).promise();

  await connection.query("SET time_zone = '+00:00'");
  await connection.query(`CREATE TEMPORARY TABLE midnight_dates (
    d DATE,
    dt DATETIME,
    dt3 DATETIME(3),
    ts TIMESTAMP NULL,
    ts6 TIMESTAMP(6) NULL
  )`);

  const midnight = '2026-05-31 00:00:00';
  await connection.query('INSERT INTO midnight_dates VALUES (?, ?, ?, ?, ?)', [
    '2026-05-31',
    midnight,
    midnight,
    midnight,
    midnight,
  ]);

  const [rows] = await connection.execute<RowDataPacket[]>(
    'SELECT * FROM midnight_dates'
  );

  await it('keeps 00:00:00 for TIMESTAMP at midnight', () => {
    strict.equal(rows[0].ts, '2026-05-31 00:00:00');
    strict.equal(rows[0].ts6, '2026-05-31 00:00:00');
  });

  await it('keeps 00:00:00 for DATETIME at midnight', () => {
    strict.equal(rows[0].dt, '2026-05-31 00:00:00');
    strict.equal(rows[0].dt3, '2026-05-31 00:00:00');
  });

  await it('returns DATE without a time component', () => {
    strict.equal(rows[0].d, '2026-05-31');
  });

  await connection.end();
});

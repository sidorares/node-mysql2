import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type TimeRow = RowDataPacket & {
  centiseconds: string;
  milliseconds: string;
  microseconds: string;
  beyondOneDay: string;
  tenths: string;
  negative: string;
  zero: string;
};

await describe('binary protocol keeps leading zeros in TIME fractional seconds', async () => {
  const connection = createConnection().promise();

  await connection.query(`CREATE TEMPORARY TABLE time_fractions (
    centiseconds TIME(6),
    milliseconds TIME(6),
    microseconds TIME(6),
    beyondOneDay TIME(6),
    tenths TIME(6),
    negative TIME(6),
    zero TIME(6)
  )`);

  await connection.query(
    'INSERT INTO time_fractions VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      '01:02:03.050000',
      '01:02:03.001000',
      '01:02:03.000123',
      '123:23:45.000001',
      '01:02:03.500000',
      '-01:23:44.880000',
      '00:00:00.000000',
    ]
  );

  const [rows] = await connection.execute<TimeRow[]>(
    'SELECT * FROM time_fractions'
  );

  it('keeps fractions below 0.1s', () => {
    strict.equal(rows[0].centiseconds, '01:02:03.05');
    strict.equal(rows[0].milliseconds, '01:02:03.001');
    strict.equal(rows[0].microseconds, '01:02:03.000123');
    strict.equal(rows[0].beyondOneDay, '123:23:45.000001');
  });

  it('still trims trailing zeros', () => {
    strict.equal(rows[0].tenths, '01:02:03.5');
    strict.equal(rows[0].negative, '-01:23:44.88');
    strict.equal(rows[0].zero, '00:00:00');
  });

  await connection.end();
});

import type { RowDataPacket } from '../../../promise.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('dateStrings: execute keeps the column fraction digits as query does', async () => {
  const connection = createConnection({ dateStrings: true }).promise();

  await connection.query("SET time_zone = '+00:00'");
  await connection.query(`CREATE TEMPORARY TABLE fractions (
    id INT,
    dt DATETIME,
    dt3 DATETIME(3),
    dt6 DATETIME(6),
    ts3 TIMESTAMP(3) NULL,
    t TIME,
    t3 TIME(3),
    t6 TIME(6)
  )`);
  const values = [
    [1, '2026-03-08 09:31:00', '10:00:00'],
    [2, '2026-03-08 09:31:00.5', '10:00:00.5'],
    [3, '2026-03-08 00:00:00', '-01:02:03.25'],
    [4, '2026-03-08 09:31:00.000001', '123:23:45.000001'],
    [5, '2026-03-08 09:31:00', '00:00:00'],
  ];
  for (const [id, datetime, time] of values) {
    await connection.query(
      'INSERT INTO fractions VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, datetime, datetime, datetime, datetime, time, time, time]
    );
  }

  const sql = 'SELECT * FROM fractions ORDER BY id';
  const [textRows] = await connection.query<RowDataPacket[]>(sql);
  const [binaryRows] = await connection.execute<RowDataPacket[]>(sql);

  await it('returns the same strings from both protocols', () => {
    strict.deepEqual(
      binaryRows.map((row) => ({ ...row })),
      textRows.map((row) => ({ ...row }))
    );
  });

  await it('pads an all-zero fraction to the column fraction digits', () => {
    strict.equal(binaryRows[0].dt, '2026-03-08 09:31:00');
    strict.equal(binaryRows[0].dt3, '2026-03-08 09:31:00.000');
    strict.equal(binaryRows[0].ts3, '2026-03-08 09:31:00.000');
    strict.equal(binaryRows[0].t3, '10:00:00.000');
  });

  await it('keeps the trailing zeros of a TIME fraction', () => {
    strict.equal(binaryRows[1].t3, '10:00:00.500');
    strict.equal(binaryRows[1].t6, '10:00:00.500000');
  });

  await connection.end();
});

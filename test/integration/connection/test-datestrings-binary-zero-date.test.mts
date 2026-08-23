import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('dateStrings: binary protocol keeps the zero date of DATE/DATETIME/TIMESTAMP', async () => {
  const connection = createConnection({ dateStrings: true }).promise();

  const [modes] = await connection.query<RowDataPacket[]>(
    'SELECT @@sql_mode AS value'
  );
  const relaxedMode = String(modes[0].value)
    .split(',')
    .filter((mode) => mode !== 'NO_ZERO_DATE' && mode !== 'NO_ZERO_IN_DATE')
    .join(',');

  await connection.query('SET sql_mode=?', [relaxedMode]);
  await connection.query(
    'CREATE TEMPORARY TABLE zero_dates (d DATE, dt DATETIME, ts TIMESTAMP NULL)'
  );
  await connection.query(
    "INSERT INTO zero_dates VALUES ('0000-00-00', '0000-00-00 00:00:00', '0000-00-00 00:00:00')"
  );

  const [rows] = await connection.execute<RowDataPacket[]>(
    'SELECT * FROM zero_dates'
  );

  await it('returns the zero DATETIME and TIMESTAMP as strings', () => {
    strict.equal(rows[0].dt, '0000-00-00 00:00:00');
    strict.equal(rows[0].ts, '0000-00-00 00:00:00');
  });

  await it('returns the zero DATE as a string', () => {
    strict.equal(rows[0].d, '0000-00-00');
  });

  await connection.end();
});

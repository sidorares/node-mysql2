import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection, getMysqlVersion } from '../../common.test.mjs';

await describe('Date Parameter', async () => {
  const connection = createConnection({ timezone: 'Z' });
  const { major } = await getMysqlVersion(connection);

  await it('should handle date parameter in execute', async () => {
    let rows: RowDataPacket[] | undefined;

    connection.query("set time_zone = '+00:00'");

    await new Promise<void>((resolve, reject) => {
      connection.execute<RowDataPacket[]>(
        'SELECT UNIX_TIMESTAMP(?) t',
        [new Date('1990-01-01 UTC')],
        (err, _rows) => {
          if (err) return reject(err);
          rows = _rows;
          connection.end(() => {
            resolve();
          });
        }
      );
    });

    const expected = major < 8 ? 631152000 : '631152000.000000';
    strict.deepEqual(rows, [{ t: expected }]);
  });
});

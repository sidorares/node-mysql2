import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

await describe('Custom Date Parameter', async () => {
  const connection = createConnection({ timezone: 'Z' });

  // @ts-expect-error: intentionally replacing global Date for testing
  // eslint-disable-next-line no-global-assign
  Date = (function () {
    const NativeDate = Date;
    function CustomDate(str: string) {
      return new NativeDate(str);
    }
    CustomDate.now = Date.now;
    return CustomDate;
  })();

  await it('should handle custom Date constructor', async () => {
    let rows: RowDataPacket[] | undefined;

    connection.query("set time_zone = '+00:00'");

    await new Promise<void>((resolve, reject) => {
      connection.execute<RowDataPacket[]>(
        'SELECT UNIX_TIMESTAMP(?) t',
        [new Date('1990-08-08 UTC')],
        (err, _rows) => {
          if (err) return reject(err);
          rows = _rows;
          connection.end();
          resolve();
        }
      );
    });

    strict.equal(rows?.[0].t, 650073600);
  });
});

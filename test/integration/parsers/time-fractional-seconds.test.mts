import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection } from '../../common.test.mjs';

type TimeRow = RowDataPacket & { t: string };

await describe('TIME fractional seconds', async () => {
  const connection = createConnection().promise();

  await connection.query(
    'CREATE TEMPORARY TABLE `tmp_time` (`id` INT, `t` TIME(6))'
  );

  await connection.query(
    "INSERT INTO `tmp_time` VALUES (1, '01:02:03.050000'), (2, '01:02:03.000123')"
  );

  await it('execute results keep leading zeros', async () => {
    const [rows] = await connection.execute<TimeRow[]>(
      'SELECT `t` FROM `tmp_time` ORDER BY `id`'
    );

    strict.equal(rows[0].t, '01:02:03.05');
    strict.equal(rows[1].t, '01:02:03.000123');
  });

  await connection.end();
});

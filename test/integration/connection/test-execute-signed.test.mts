import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createConnection, normalizeNumeric } from '../../common.test.mjs';

type TestRow = RowDataPacket & { id: number; num: number; l: number };

await describe('Execute Signed', async () => {
  const connection = createConnection();

  connection.query(
    [
      'CREATE TEMPORARY TABLE `test_table` (',
      '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
      '`num` int(15),',
      '`l` long,',
      'PRIMARY KEY (`id`)',
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
    ].join('\n')
  );

  connection.query('insert into test_table(num,l) values(?, 3)', [1]);
  connection.query('insert into test_table(num,l) values(3-?, -10)', [5]);
  connection.query(
    'insert into test_table(num,l) values(4+?, 4000000-?)',
    [-5, 8000000]
  );

  await it('should handle signed integer values', async () => {
    const rows = await new Promise<TestRow[]>((resolve, reject) => {
      connection.execute<TestRow[]>(
        'SELECT * from test_table',
        [],
        (err, _rows) => {
          if (err) return reject(err);
          resolve(_rows);
        }
      );
    });

    strict.deepEqual(normalizeNumeric(rows), [
      { id: 1, num: 1, l: 3 },
      { id: 2, num: -2, l: -10 },
      { id: 3, num: -1, l: -4000000 },
    ]);
  });

  connection.end();
});

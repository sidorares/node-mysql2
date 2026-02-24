import type { Pool, RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
import { createPool } from '../../common.test.mjs';

type TestRow = RowDataPacket & { str: string };

await describe('Parameters Questionmark', async () => {
  const pool: Pool = createPool();
  pool.config.connectionLimit = 1;

  pool.query(
    [
      'CREATE TEMPORARY TABLE `test_table` (',
      '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
      '`str` varchar(64),',
      'PRIMARY KEY (`id`)',
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
    ].join('\n')
  );
  pool.query('insert into test_table(str) values(?)', ['abc?']);
  pool.query('UPDATE test_table SET str = ? WHERE id = ?', [
    'should not change ?',
    1,
  ]);

  await it('should preserve questionmarks in values', async () => {
    await new Promise<void>((resolve, reject) => {
      pool.query<TestRow[]>(
        'SELECT str FROM test_table WHERE id = ?',
        [1],
        (err, rows) => {
          pool.end();
          if (err) return reject(err);
          strict.deepEqual(rows, [{ str: 'should not change ?' }]);
          resolve();
        }
      );
    });
  });
});

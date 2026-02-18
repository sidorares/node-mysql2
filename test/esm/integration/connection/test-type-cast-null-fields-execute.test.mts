import type { RowDataPacket } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection, useTestDb } from '../../common.test.mjs';

type InsertTestRow = RowDataPacket & {
  id: number;
  date: string | null;
  number: number | null;
};

await describe('Type Cast Null Fields (execute)', async () => {
  const connection = createConnection();

  useTestDb();

  const table = 'insert_test';

  await it('should return null for null fields', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.execute(
        [
          `CREATE TEMPORARY TABLE \`${table}\` (`,
          '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
          '`date` DATETIME NULL,',
          '`number` INT NULL,',
          'PRIMARY KEY (`id`)',
          ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
        ].join('\n'),
        (err) => {
          if (err) return reject(err);

          connection.execute(
            `INSERT INTO ${table} (date, number) VALUES (?, ?)`,
            [null, null],
            (err) => {
              if (err) return reject(err);

              connection.execute<InsertTestRow[]>(
                `SELECT * FROM ${table}`,
                (err, _results) => {
                  if (err) return reject(err);

                  assert.strictEqual(_results[0].date, null);
                  assert.strictEqual(_results[0].number, null);

                  connection.end();
                  resolve();
                }
              );
            }
          );
        }
      );
    });
  });
});

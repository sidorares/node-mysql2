import type { RowDataPacket } from '../../../index.js';
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
        (err) => (err ? reject(err) : resolve())
      );
    });

    await new Promise<void>((resolve, reject) => {
      connection.execute(
        `INSERT INTO ${table} (date, number) VALUES (?, ?)`,
        [null, null],
        (err) => (err ? reject(err) : resolve())
      );
    });

    const results = await new Promise<InsertTestRow[]>((resolve, reject) => {
      connection.execute<InsertTestRow[]>(
        `SELECT * FROM ${table}`,
        (err, _results) => (err ? reject(err) : resolve(_results))
      );
    });

    assert.strictEqual(results[0].date, null);
    assert.strictEqual(results[0].number, null);
  });

  connection.end();
});

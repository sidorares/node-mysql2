import type { RowDataPacket } from '../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection, useTestDb } from '../../common.test.mjs';

type InsertTestRow = RowDataPacket & {
  id: number;
  date: string | null;
  number: number | null;
};

await describe('Type Cast Null Fields', async () => {
  const connection = createConnection();

  useTestDb();

  const table = 'insert_test';
  connection.query(
    [
      `CREATE TEMPORARY TABLE \`${table}\` (`,
      '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
      '`date` DATETIME NULL,',
      '`number` INT NULL,',
      'PRIMARY KEY (`id`)',
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
    ].join('\n')
  );

  connection.query(`INSERT INTO ${table} SET ?`, {
    date: null,
    number: null,
  });

  await it('should return null for null fields', async () => {
    const results = await new Promise<InsertTestRow[]>((resolve, reject) => {
      connection.query<InsertTestRow[]>(
        `SELECT * FROM ${table}`,
        (_err, _results) => (_err ? reject(_err) : resolve(_results))
      );
    });

    assert.strictEqual(results[0].date, null);
    assert.strictEqual(results[0].number, null);
  });

  connection.end();
});

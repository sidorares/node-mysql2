import type { ResultSetHeader, RowDataPacket } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection } from '../../common.test.mjs';

type InsertTestRow = RowDataPacket & { id: number; title: string };

await describe('Insert Results', async () => {
  const connection = createConnection();

  // common.useTestDb(connection);

  const table = 'insert_test';
  // const text = "本日は晴天なり";
  const text = ' test test test ';
  connection.query(
    [
      `CREATE TEMPORARY TABLE \`${table}\` (`,
      '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
      '`title` varchar(255),',
      'PRIMARY KEY (`id`)',
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
    ].join('\n')
  );

  await it('should return correct insert results', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.query<ResultSetHeader>(
        `INSERT INTO ${table} SET title="${text}"`,
        (err, result) => {
          if (err) return reject(err);
          connection.query<InsertTestRow[]>(
            `SELECT * FROM ${table} WHERE id = ${result.insertId}`,
            (_err, result2) => {
              if (_err) return reject(_err);

              assert.strictEqual(result.insertId, 1);
              assert.strictEqual(result2.length, 1);
              // TODO: type conversions
              assert.equal(result2[0].id, String(result.insertId));
              assert.equal(result2[0].title, text);

              connection.end();
              resolve();
            }
          );
        }
      );
    });
  });
});

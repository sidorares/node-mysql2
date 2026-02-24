import type { ResultSetHeader, RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
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
    const insertResult = await new Promise<ResultSetHeader>(
      (resolve, reject) => {
        connection.query<ResultSetHeader>(
          `INSERT INTO ${table} SET title="${text}"`,
          (err, result) => (err ? reject(err) : resolve(result))
        );
      }
    );

    const selectResult = await new Promise<InsertTestRow[]>(
      (resolve, reject) => {
        connection.query<InsertTestRow[]>(
          `SELECT * FROM ${table} WHERE id = ${insertResult.insertId}`,
          (err, result) => (err ? reject(err) : resolve(result))
        );
      }
    );

    strict.strictEqual(insertResult.insertId, 1);
    strict.strictEqual(selectResult.length, 1);
    // TODO: type conversions
    strict.equal(selectResult[0].id, insertResult.insertId);
    strict.equal(selectResult[0].title, text);
  });

  connection.end();
});

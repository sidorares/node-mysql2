import type { RowDataPacket } from '../../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection, useTestDb } from '../../common.test.mjs';

await describe('Transaction Rollback', async () => {
  const connection = createConnection();

  useTestDb();

  const table = 'transaction_test';
  connection.query(
    [
      `CREATE TEMPORARY TABLE \`${table}\` (`,
      '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
      '`title` varchar(255),',
      'PRIMARY KEY (`id`)',
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
    ].join('\n')
  );

  await it('should rollback a transaction successfully', async () => {
    await new Promise<void>((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) return reject(err);

        const row = {
          id: 1,
          title: 'Test row',
        };

        connection.query(`INSERT INTO ${table} SET ?`, row, (err) => {
          if (err) return reject(err);

          connection.rollback((err) => {
            if (err) return reject(err);

            connection.query<RowDataPacket[]>(
              `SELECT * FROM ${table}`,
              (err, rows) => {
                if (err) return reject(err);
                connection.end();
                assert.equal(rows.length, 0);
                resolve();
              }
            );
          });
        });
      });
    });
  });
});

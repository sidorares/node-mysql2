import type { RowDataPacket } from '../../../index.js';
import { describe, it, strict } from 'poku';
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
      connection.beginTransaction((err) => (err ? reject(err) : resolve()));
    });

    await new Promise<void>((resolve, reject) => {
      connection.query(
        `INSERT INTO ${table} SET ?`,
        { id: 1, title: 'Test row' },
        (err) => (err ? reject(err) : resolve())
      );
    });

    await new Promise<void>((resolve, reject) => {
      connection.rollback((err) => (err ? reject(err) : resolve()));
    });

    const rows = await new Promise<RowDataPacket[]>((resolve, reject) => {
      connection.query<RowDataPacket[]>(
        `SELECT * FROM ${table}`,
        (err, _rows) => (err ? reject(err) : resolve(_rows))
      );
    });

    strict.equal(rows.length, 0);
  });

  connection.end();
});

import type { RowDataPacket } from '../../../index.js';
import { assert, describe, it } from 'poku';
import { createConnection, useTestDb } from '../../common.test.mjs';

type TransactionRow = RowDataPacket & {
  id: number;
  title: string;
};

await describe('Transaction Commit', async () => {
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

  await it('should commit a transaction successfully', async () => {
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
      connection.commit((err) => (err ? reject(err) : resolve()));
    });

    const rows = await new Promise<TransactionRow[]>((resolve, reject) => {
      connection.query<TransactionRow[]>(
        `SELECT * FROM ${table}`,
        (err, _rows) => (err ? reject(err) : resolve(_rows))
      );
    });

    assert.equal(rows?.length, 1);
  });

  connection.end();
});

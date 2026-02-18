import type { RowDataPacket } from '../../../../index.js';
import { assert } from 'poku';
import { createConnection, useTestDb } from '../../common.test.mjs';

type TransactionRow = RowDataPacket & {
  id: number;
  title: string;
};

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

connection.beginTransaction((err) => {
  assert.ifError(err);

  const row = {
    id: 1,
    title: 'Test row',
  };

  connection.query(`INSERT INTO ${table} SET ?`, row, (err) => {
    assert.ifError(err);

    connection.commit((err) => {
      assert.ifError(err);

      connection.query<TransactionRow[]>(
        `SELECT * FROM ${table}`,
        (err, rows) => {
          assert.ifError(err);
          connection.end();
          assert.equal(rows?.length, 1);
        }
      );
    });
  });
});

import type { RowDataPacket } from '../../../../index.js';
import process from 'node:process';
import { assert } from 'poku';
import { createConnection, useTestDb } from '../../common.test.mjs';

type InsertTestRow = RowDataPacket & {
  id: number;
  date: string | null;
  number: number | null;
};

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

let results: InsertTestRow[];
connection.query<InsertTestRow[]>(
  `SELECT * FROM ${table}`,
  (_err, _results) => {
    if (_err) {
      throw _err;
    }

    results = _results;
    connection.end();
  }
);

process.on('exit', () => {
  assert.strictEqual(results[0].date, null);
  assert.strictEqual(results[0].number, null);
});

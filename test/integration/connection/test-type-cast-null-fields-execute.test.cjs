'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();

common.useTestDb(connection);

const table = 'insert_test';
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
    if (err) throw err;
  },
);

connection.execute(
  `INSERT INTO ${table} (date, number) VALUES (?, ?)`,
  [null, null],
  (err) => {
    if (err) throw err;
  },
);

let results;
connection.execute(`SELECT * FROM ${table}`, (err, _results) => {
  if (err) {
    throw err;
  }

  results = _results;
  connection.end();
});

process.on('exit', () => {
  assert.strictEqual(results[0].date, null);
  assert.strictEqual(results[0].number, null);
});

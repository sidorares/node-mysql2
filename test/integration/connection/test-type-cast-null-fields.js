'use strict';

const common = require('../../common');
const connection = common.createConnection();
const assert = require('assert');

common.useTestDb(connection);

const table = 'insert_test';
connection.query(
  [
    `CREATE TEMPORARY TABLE \`${table}\` (`,
    '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
    '`date` DATETIME NULL,',
    '`number` INT NULL,',
    'PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
  ].join('\n')
);

connection.query(`INSERT INTO ${table} SET ?`, {
  date: null,
  number: null
});

let results;
connection.query(`SELECT * FROM ${table}`, (err, _results) => {
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

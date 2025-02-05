'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');
const process = require('node:process');

const connection = common.createConnection();

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
  ].join('\n'),
);

let result, result2;
connection.query(`INSERT INTO ${table} SET title="${text}"`, (err, _result) => {
  if (err) {
    throw err;
  }
  result = _result;
  connection.query(
    `SELECT * FROM ${table} WHERE id = ${result.insertId}`,
    (err, _result2) => {
      result2 = _result2;
      connection.end();
    },
  );
});

process.on('exit', () => {
  assert.strictEqual(result.insertId, 1);
  assert.strictEqual(result2.length, 1);
  // TODO: type conversions
  assert.equal(result2[0].id, String(result.insertId));
  assert.equal(result2[0].title, text);
});

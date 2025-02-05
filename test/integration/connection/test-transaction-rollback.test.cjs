'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');

const connection = common.createConnection();

common.useTestDb(connection);

const table = 'transaction_test';
connection.query(
  [
    `CREATE TEMPORARY TABLE \`${table}\` (`,
    '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
    '`title` varchar(255),',
    'PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
  ].join('\n'),
);

connection.beginTransaction((err) => {
  assert.ifError(err);

  const row = {
    id: 1,
    title: 'Test row',
  };

  connection.query(`INSERT INTO ${table} SET ?`, row, (err) => {
    assert.ifError(err);

    connection.rollback((err) => {
      assert.ifError(err);

      connection.query(`SELECT * FROM ${table}`, (err, rows) => {
        assert.ifError(err);
        connection.end();
        assert.equal(rows.length, 0);
      });
    });
  });
});

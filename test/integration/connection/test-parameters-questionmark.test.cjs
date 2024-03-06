'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');

const pool = common.createPool();
pool.config.connectionLimit = 1;

pool.query(
  [
    'CREATE TEMPORARY TABLE `test_table` (',
    '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
    '`str` varchar(64),',
    'PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
  ].join('\n'),
);
pool.query('insert into test_table(str) values(?)', ['abc?']);
pool.query('UPDATE test_table SET str = ? WHERE id = ?', [
  'should not change ?',
  1,
]);
pool.query('SELECT str FROM test_table WHERE id = ?', [1], (err, rows) => {
  pool.end();
  if (err) {
    throw err;
  }
  assert.deepEqual(rows, [{ str: 'should not change ?' }]);
});

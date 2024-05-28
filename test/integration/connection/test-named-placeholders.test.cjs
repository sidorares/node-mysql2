'use strict';

const common = require('../../common.test.cjs');
const { assert } = require('poku');

const connection = common.createConnection();

connection.query(
  [
    'CREATE TEMPORARY TABLE `test_table` (',
    '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
    '`num1` int(15),',
    '`num2` int(15),',
    'PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8',
  ].join('\n'),
);

connection.query('insert into test_table(num1,num2) values(?, 3)', [1]);
connection.query('insert into test_table(num1,num2) values(3-?, -10)', [5]);
connection.query(
  'insert into test_table(num1,num2) values(4+?, 4000000-?)',
  [-5, 8000000],
);
connection.query(
  'insert into test_table(num1,num2) values(?, ?)',
  [-5, 8000000],
);

connection.config.namedPlaceholders = true;
const cmd = connection.execute(
  'SELECT * from test_table where num1 < :numParam and num2 > :lParam',
  { lParam: 100, numParam: 2 },
  (err, rows) => {
    if (err) {
      throw err;
    }
    assert.deepEqual(rows, [{ id: 4, num1: -5, num2: 8000000 }]);
  },
);
assert.equal(cmd.sql, 'SELECT * from test_table where num1 < ? and num2 > ?');
assert.deepEqual(cmd.values, [2, 100]);

connection.execute('SELECT :a + :a as sum', { a: 2 }, (err, rows) => {
  if (err) {
    throw err;
  }
  assert.deepEqual(rows, [{ sum: 4 }]);
});

const qCmd = connection.query(
  'SELECT * from test_table where num1 < :numParam and num2 > :lParam',
  { lParam: 100, numParam: 2 },
  (err, rows) => {
    if (err) {
      throw err;
    }
    assert.deepEqual(rows, [{ id: 4, num1: -5, num2: 8000000 }]);
  },
);
assert.equal(
  qCmd.sql,
  'SELECT * from test_table where num1 < 2 and num2 > 100',
);
assert.deepEqual(qCmd.values, [2, 100]);

connection.query('SELECT :a + :a as sum', { a: 2 }, (err, rows) => {
  if (err) {
    throw err;
  }
  assert.deepEqual(rows, [{ sum: 4 }]);
  connection.end();
});

const namedSql = connection.format(
  'SELECT * from test_table where num1 < :numParam and num2 > :lParam',
  { lParam: 100, numParam: 2 },
);
assert.equal(
  namedSql,
  'SELECT * from test_table where num1 < 2 and num2 > 100',
);

const unnamedSql = connection.format(
  'SELECT * from test_table where num1 < ? and num2 > ?',
  [2, 100],
);
assert.equal(
  unnamedSql,
  'SELECT * from test_table where num1 < 2 and num2 > 100',
);

const pool = common.createPool();
pool.config.connectionConfig.namedPlaceholders = true;
pool.query('SELECT :a + :a as sum', { a: 2 }, (err, rows) => {
  pool.end();
  if (err) {
    throw err;
  }
  assert.deepEqual(rows, [{ sum: 4 }]);
});

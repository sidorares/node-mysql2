var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');


connection.query([
  'CREATE TEMPORARY TABLE `test_table` (',
  '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
  '`num1` int(15),',
  '`num2` int(15),',
  'PRIMARY KEY (`id`)',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
].join('\n'));

connection.query('insert into test_table(num1,num2) values(?, 3)', [1]);
connection.query('insert into test_table(num1,num2) values(3-?, -10)', [5]);
connection.query('insert into test_table(num1,num2) values(4+?, 4000000-?)', [-5, 8000000]);
connection.query('insert into test_table(num1,num2) values(?, ?)', [-5, 8000000]);

connection.config.namedPlaceholders = true;
var cmd = connection.execute('SELECT * from test_table where num1 < :numParam and num2 > :lParam', {lParam: 100, numParam: 2}, function(err, rows, fields) {
  if (err) throw err;
  assert.deepEqual(rows, [ { id: 4, num1: -5, num2: 8000000 } ]);
});
assert.equal(cmd.sql, 'SELECT * from test_table where num1 < ? and num2 > ?');
assert.deepEqual(cmd.values, [2, 100]);

connection.execute('SELECT :a + :a as sum', {a: 2}, function(err, rows, fields) {
  if (err) throw err;
  assert.deepEqual(rows, [{"sum":4}]);
});

var qCmd = connection.query('SELECT * from test_table where num1 < :numParam and num2 > :lParam', {lParam: 100, numParam: 2}, function(err, rows, fields) {
  if (err) throw err;
  assert.deepEqual(rows, [ { id: 4, num1: -5, num2: 8000000 } ]);
});
assert.equal(qCmd.sql, 'SELECT * from test_table where num1 < 2 and num2 > 100');
assert.equal(typeof qCmd.values, 'undefined');

connection.query('SELECT :a + :a as sum', {a: 2}, function(err, rows, fields) {
  if (err) throw err;
  assert.deepEqual(rows, [{"sum":4}]);
});

var sql = connection.format('SELECT * from test_table where num1 < :numParam and num2 > :lParam', {lParam: 100, numParam: 2});
assert.equal(sql, 'SELECT * from test_table where num1 < 2 and num2 > 100');

connection.end();

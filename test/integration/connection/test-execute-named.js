var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

connection.config.namedParameters = true;

connection.query([
  'CREATE TEMPORARY TABLE `test_table` (',
  '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
  '`num` int(15),',
  '`l` long,',
  'PRIMARY KEY (`id`)',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
].join('\n'));

connection.query('insert into test_table(num,l) values(?, 3)', [1]);
connection.query('insert into test_table(num,l) values(3-?, -10)', [5]);
connection.query('insert into test_table(num,l) values(4+?, 4000000-?)', [-5, 8000000]);
connection.query('insert into test_table(num,l) values(?, ?)', [-5, 8000000]);

connection.execute('SELECT * from test_table where num < :numParam and l > :lParam', {lParam: 100, numParam: 2}, function(err, rows, fields) {
  if (err) throw err;
  assert.deepEqual(rows, [ { id: 1, num: 1, l: '3' }, { id: 4, num: -5, l: '8000000' } ]);
});

connection.execute('SELECT :a + :a as sum', {a: 2}, function(err, rows, fields) {
  if (err) throw err;
  assert.deepEqual(rows, [{"sum":4}]);
});

connection.end();

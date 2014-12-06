var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var rows = undefined;
var fields = undefined;

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

connection.execute('SELECT * from test_table', [], function(err, _rows, _fields) {
  if (err) throw err;
  rows = _rows;
  fields = _fields;
  connection.end();
});


process.on('exit', function() {
  assert.deepEqual(rows, [{"id":1,"num":1,"l": 3},{"id":2,"num":-2,"l":-10},{"id":3,"num":-1,"l":-4000000}]);
});

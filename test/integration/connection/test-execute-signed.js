var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

connection.query([
  'CREATE TEMPORARY TABLE `test_table` (',
  't TINYINT(1)',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
].join('\n'));

connection.query('insert into test_table(t) values(?)', [0]);
connection.query('insert into test_table(t) values(?)', [1]);
connection.query('insert into test_table(t) values(?)', [-1]);
connection.query('insert into test_table(t) values(?)', [123]);

connection.execute('SELECT * from test_table', function(err, rows, fields) {
  if (err) throw err;
  console.log(rows);

  rows.forEach(function(r) {
    console.log(!!r.t ? "true" : "false");
  });
});

connection.end();

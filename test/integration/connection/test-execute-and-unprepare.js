var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

var max = 500;
var start = process.hrtime();
function exec(i) {
  var query = 'select 1+' + i;
  connection.execute(query, function(err, rows, columns) {
    connection.unprepare(query);
    if (err) throw err;
    if (i > max)
      connection.end();
    else
      exec(i+1);
  });
}
connection.query('SET GLOBAL max_prepared_stmt_count=10', function(err) {
  if (err) throw err;
  exec(1);
});

// get the client
var mysql = require('mysql2');

// create the connection to database
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'test'
});

connection.execute('select ?+1 as qqq, ? as rrr, ? as yyy', [1, null, 3], function(
  err,
  rows,
  fields
) {
  console.log(err, rows, fields);
  connection.execute('select ?+1 as qqq, ? as rrr, ? as yyy', [3, null, 3], function(
    err,
    rows,
    fields
  ) {
    console.log(err, rows, fields);
    mysql.unprepare('select ?+1 as qqq, ? as rrr, ? as yyy');
    connection.execute(
      'select ?+1 as qqq, ? as rrr, ? as yyy',
      [3, null, 3],
      function(err, rows, fields) {
        console.log(err, rows, fields);
      }
    );
  });
});

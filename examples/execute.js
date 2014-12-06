var mysql = require('../test/common').createConnection();
mysql.execute("select ?+1 as qqq, ? as rrr, ? as yyy", [1, null, 3], function(err, rows, fields) {
//mysql.execute("select ?+?+? as qqq, ? as rrr", [1, 2, 5, "test"], function(err, rows, fields) {
  console.log(err, rows, fields);
  mysql.execute("select ?+1 as qqq, ? as rrr, ? as yyy", [3, null, 3], function(err, rows, fields) {
    console.log(err, rows, fields);
    mysql.unprepare("select ?+1 as qqq, ? as rrr, ? as yyy");
    mysql.execute("select ?+1 as qqq, ? as rrr, ? as yyy", [3, null, 3], function(err, rows, fields) {
      console.log(err, rows, fields);
    });
  });
});

var mysql = require('../test/common').createConnection();
mysql.execute("select * from foos limit ?", [10], function(err, rows, fields) {
  // Work in progress
  console.log(err, rows, fields);
});

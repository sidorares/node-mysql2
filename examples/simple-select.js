var mysql = require('../test/common').createConnection();

mysql.query("select * from foos limit 10", function(err, rows, fields) {
    console.log(rows, fields);
});

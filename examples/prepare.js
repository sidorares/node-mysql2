var mysql = require('../test/common').createConnection();

mysql.prepare("SELECT * from mysql.user into outfile '/tmp/mysql.user.txt'", function(err, stmt) {
    console.log(stmt);
});

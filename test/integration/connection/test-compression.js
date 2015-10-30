var mysql = require('./index.js')

// TODO figure out reliable way to check if compression is enabled

// this does not work for me for some reason - https://dev.mysql.com/doc/refman/5.1/en/server-status-variables.html#statvar_Compression

// select big string, check that diff in Bytes_sent is less than string lingth

// WIP
//
  var connection = mysql.createConnection({ user: 'root', password: '', port: 3306, compress: true, debug: true });
  connection.query("SHOW GLOBAL STATUS where Variable_name like 'Bytes_sent'", function (err, rows, fields) {
    var sent1 = rows[0].Value;
    process.exit(0);
    connection.query("SHOW GLOBAL STATUS where Variable_name like 'Bytes_sent'", function (err, rows, fields) {
      var sent2 = rows[0].Value;
    })
  })

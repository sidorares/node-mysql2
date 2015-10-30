var mysql = require('./index.js')

// TODO figure out reliable way to check if compression is enabled


// select big string, check that diff in Bytes_sent is less than string lingth

// WIP
//
  var connection = mysql.createConnection({ user: 'root', password: '', port: 3307, compress: true, debug: true });
  connection.query("SHOW GLOBAL STATUS where Variable_name like 'Bytes_sent'", function (err, rows, fields) {
    console.log(err, rows[0].Value);
    connection.query("SHOW GLOBAL STATUS where Variable_name like 'Bytes_sent'", function (err, rows, fields) {
      console.log(err, rows[0].Value);
    })
  })

var mysql = require('mysql2');

var conn = mysql.createConnection({
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DB,
  host: process.env.HOST,
  port: 3306,
  ssl: 'Amazon RDS'
});

conn.query("show status like 'Ssl_cipher'", function(err, res) {
  console.log(err, res);
  conn.end();
});

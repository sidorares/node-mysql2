var fs = require('fs');
var mysql = require('../../index.js');
var conn = mysql.createConnection({
   user: 'root',
   password: '',
   database: 'test',
   host: '127.0.0.1',
   port: '3306',
   ssl: {
     //key: fs.readFileSync('./certs/client-key.pem'),
     //cert: fs.readFileSync('./certs/client-cert.pem')
     ca: fs.readFileSync('./certs/ca-cert.pem')
   }
});

conn.query('select 1+1 as test', function(err, res) {
  console.log(res);
  conn.query('select repeat("a", 100) as test', function(err, res) {
    console.log(res);
  });
});

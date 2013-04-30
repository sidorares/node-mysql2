var fs = require('fs');
var mysql = require('../../index.js');
var conn = mysql.createConnection({
   user: 'root',
   password: '',
   database: 'test',
   socketPath: '/tmp/mysql.sock',
   ssl: {
     key: fs.readFileSync('./certs/client-key.pem'),
     cert: fs.readFileSync('./certs/client-cert.pem')
   }
});

conn.query('select 1+1 as test', function(err, res) {
  console.log(res);
});

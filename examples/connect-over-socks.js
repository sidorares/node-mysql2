var SocksConnection = require('socksjs');
var mysql = require('../index.js');

//var socksProxy = new SocksConnection({ port: 3306 });
//var conn = mysql.createConnection({
//  stream: socksProxy,
//});

//conn.query("select 1+1", function(err, rows, fields) {
//  console.log(err, rows, fields);
//});


var conn1 = mysql.createPool({
  debug: 1,
  stream: function() {
    return new SocksConnection({ port: 3306 });
  }
});


conn1.execute("select sleep(1.1) as www", function(err, rows, fields) {
  console.log(err, rows, fields);
});


conn1.execute("select sleep(1) as qqq", function(err, rows, fields) {
  console.log(err, rows, fields);
});

conn1.execute("select sleep(1) as qqq", function(err, rows, fields) {
  console.log(err, rows, fields);
});

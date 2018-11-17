'use strict';

const mysql = require('mysql2');
const SocksConnection = require('socksjs');

// const socksProxy = new SocksConnection({ port: 3306 });
// const conn = mysql.createConnection({
//   stream: socksProxy,
// });

// conn.query("select 1+1", function(err, rows, fields) {
//   console.log(err, rows, fields);
// });

const conn1 = mysql.createPool({
  debug: 1,
  stream: function() {
    return new SocksConnection({ port: 3306 });
  }
});

conn1.execute('select sleep(1.1) as www', (err, rows, fields) => {
  console.log(err, rows, fields);
});

conn1.execute('select sleep(1) as qqq', (err, rows, fields) => {
  console.log(err, rows, fields);
});

conn1.execute('select sleep(1) as qqq', (err, rows, fields) => {
  console.log(err, rows, fields);
});

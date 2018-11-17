'use strict';

const mysql = require('mysql2').createConnection({
  host: 'localhost',
  user: 'root',
  database: 'test',
  passwordSha1: Buffer.from('8bb6118f8fd6935ad0876a3be34a717d32708ffd', 'hex')
});

mysql.execute(
  'select ?+1 as qqq, ? as rrr, ? as yyy',
  [1, null, 3],
  (err, rows, fields) => {
    console.log(err, rows, fields);
  }
);

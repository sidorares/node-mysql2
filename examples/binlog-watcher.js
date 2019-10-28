'use strict';

const mysql = require('mysql2');
const through2 = require('through2');

const binlogStream = mysql.createBinlogStream({
  serverId: 123, // slave ID, first field in "show slave hosts" sql response
  // you can also specify slave host, username, password and port
  masterId: 0,
  filename: 'mysql-bin.000007',
  binlogPos: 120,
  flags: 1 // 1 = "non-blocking mode"
});

binlogStream.pipe(
  through2.obj((obj, enc, next) => {
    console.log(obj);
    next();
  })
);

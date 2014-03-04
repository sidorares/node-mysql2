var mysql = require('../test/common').createConnection();
var through2 = require('through2');

var binlogStream = mysql.createBinlogStream({
  serverId: 123, // slave ID, first field in "show slave hosts" sql response
  // you can also specify slave host, username, password and port
  masterId: 0,
  filename: 'mysql-bin.000007',
  binlogPos: 120,
  flags: 1, // 1 = "non-blocking mode"
});

binlogStream.pipe(through2.obj(function(obj, enc, next) {
  console.log(obj);
  next();
}));

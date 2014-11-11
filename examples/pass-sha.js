var mysql = require('../index.js').createConnection({
  user: 'testuser',
  //password: 'testpassword'
  passwordSha1: Buffer('8bb6118f8fd6935ad0876a3be34a717d32708ffd', 'hex')
});
mysql.execute("select ?+1 as qqq, ? as rrr, ? as yyy", [1, null, 3], function(err, rows, fields) {
  console.log(err, rows, fields);
});

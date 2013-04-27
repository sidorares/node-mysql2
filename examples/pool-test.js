var pool = require('../test/common').createPool();

setInterval(function() {
for (var i=0; i < 5; ++i) {
  pool.getConnection(function(err, db) {
    db.query("select sleep(0.5) as qqq", function(err, rows, fields) {
      console.log(rows, fields);
      db.end();
    });
  });
}
}, 1000);

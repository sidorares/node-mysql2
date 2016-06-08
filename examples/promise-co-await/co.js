var mysql = require('../promise.js');
var co = require('co')

co(function * () {
  var c = yield mysql.createConnection({ port: 3307, user: 'root', namedPlaceholders: true });
  var rows = yield c.query('show databases');
  console.log(rows)
  console.log( yield c.execute('select 1+:toAdd as qqq', {toAdd: 10}) );
  yield c.end();

}).then(function() {
  console.log('done');
}, function(err) {
  console.log(err);
  throw err;
});

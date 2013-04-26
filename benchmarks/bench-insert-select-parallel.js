var common     = require('../test/common');
var connection = common.createConnection();
var assert     = require('assert');

var table = 'insert_test';
//var text = "本日は晴天なり";
var text = "test abc xyz";
connection.query('drop table ' + table).on('error', function() {});
connection.query([
  'CREATE TABLE `' + table + '` (',
  '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
  '`title` varchar(255) NOT NULL,',
  'PRIMARY KEY (`id`)',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
].join('\n'));

function benchmarkInsert(numLeft, callback) {
  connection.query('INSERT INTO ' + table + ' SET title="' + text + '"', function(err, result) {
    if (err) throw err;
    if (numLeft > 1)
      benchmarkInsert(numLeft-1, callback);
    else
      callback();
  });
}

function benchmarkInserts(n, cb) {
  var numInsert = 50000;
  var start = process.hrtime();
  benchmarkInsert(numInsert, function() {
    var end = process.hrtime();
    var diff = common.hrdiff(start, end);
    console.log(numInsert*1e9/diff + ' inserts/sec');
    if (n > 1)
      benchmarkInserts(n - 1, cb);
    else
      cb();
  });
}

function benchmarkParallelSelects(n, size, cb) {
  var start = process.hrtime();
  var numRunning = 0;

  function commandDone() {
    console.log(numRunning);
    numRunning--;
    if (numRunning > 0)
      return;
    var end = process.hrtime();
    var diff = common.hrdiff(start, end);
    console.log(size + ' rows: ' +  n*1e9/diff + ' results/sec, ' +  size*n*1e9/diff + ' rows/sec');
    cb();
  }

  var connections = new Array(n);
  for (var i=0; i < n; ++i)
  {
    numRunning++;
    connections[i] = common.createConnection();
    var cmd = connections[i].execute('select * from ' + table + ' limit ' + size, []);
    cmd.on('end', commandDone);
  }
}

module.exports = function(done) {
  var testStart = process.hrtime();
  benchmarkInserts(1, function() {
    benchmarkParallelSelects(8, 50000, function() {
      var testEnd = process.hrtime();
      console.log('total time: ', common.hrdiff(testStart, testEnd)/1e9 );
      if (done)
        done();
    });
  });
};

if (require.main === module) {
  module.exports();
}

var common     = require('../test/common');
var connection = common.createConnection();
var assert     = require('assert');

// ==== simple pool ===
var connections = new Array(10);
for (var i=0; i < connections.length; ++i)
  connections[i] = common.createConnection();
var currConn = 0;
function next() {
  currConn++;
  if (currConn == connections.length)
    currConn = 0;
  connection = connections[currConn];
}
// ======================

function benchmarkSelect(numLeft, callback) {
  //connection.query('query from fake server fixture', function(err, result) {

  // comment if no pool:
  next();

  var rows = 0;
  var q = connection.query('query from fake server fixture');
  q.on('result', function() { rows++; });
  q.on('end', function() {
    if (numLeft > 1)
      benchmarkSelect(numLeft-1, callback);
    else
      callback(rows);
  });
}

function benchmarkSelects(n, cb) {
  var numSelects = 100000;
  var start = process.hrtime();
  benchmarkSelect(numSelects, function(rowsPerQuery) {
    var end = process.hrtime();
    var diff = common.hrdiff(start, end);
    console.log(' rows: ' +  numSelects*1e9/diff + ' results/sec, ' +  rowsPerQuery*numSelects*1e9/diff + ' rows/sec');
    if (n > 1)
      benchmarkSelects(n - 1, cb);
    else
      cb();
  });
}

module.exports = function(done) {
  var testStart = process.hrtime();
  benchmarkSelects(5, function() {
    var testEnd = process.hrtime();
    console.log('total time: ', common.hrdiff(testStart, testEnd)/1e9 );
    connection.end();
    if (done)
      done();
  });
};

  module.exports();

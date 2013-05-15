var common     = require('../test/common');

    var Client = require('mariasql');
    var connection = new Client();
    connection.connect({
      host: '127.0.0.1',
      port: 3333,
      user: 'root',
      password: '',
      db: 'test'
    });


var assert     = require('assert');

function benchmarkSelect(numLeft, callback) {
    numRows = 0;
    var q = connection.query('select 1+1 as qqq');
    q.on('result', function(res) {
        //console.log("result!");
        //console.log(res);

        res.on('row', function(r) {
           //console.log(r);
           numRows++;
        });

        res.on('end', function() {
          if (numLeft > 1)
            benchmarkSelect(numLeft-1, callback);
          else
            callback(numRows);
        });
      });
}

function benchmarkSelects(n, cb) {
  var numSelects = 100;
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
  console.log('connected');
  var testStart = process.hrtime();
  benchmarkSelects(5, function() {
    var testEnd = process.hrtime();
    console.log('total time: ', common.hrdiff(testStart, testEnd)/1e9 );
    connection.end();
    if (done)
      done();
  });
};

connection.on('connect', module.exports);

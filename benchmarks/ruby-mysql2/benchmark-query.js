var assert = require('assert');
var createConnection = require('../../test/common').createConnection;

var sql = process.argv[2];
var starthr = process.hrtime();
var haml = require('hamljs');
var fs = require('fs');

var render = haml.compile(fs.readFileSync('./views/index.haml'));

l = 0;
var rowsReceived = 0;
var numRequests = 0;

(function(cb) {
    var db = createConnection();

       var left = 1;

       var start = Date.now();
       var prev1000 = start;
       function bench()
       {
           //db.query(sql).on('end', function(err, res) {
           db.query(sql, function(err, res) {
           //db.execute(sql, function(err, res) {

               rowsReceived += res.length;
               numRequests++;

               l += render({results: res}).length;
               console.log(render({results: res}));

               left--;
               if (left % 1000 === 0)
               {
                   var curTime = Date.now();
                   var last1000time = curTime - prev1000;
                   prev1000 = curTime;
                   console.error( (1000000/last1000time) + ' req/sec' );
               }

               if (left > 0)
                   bench();
               else {
                   console.error( numRequests *1000/(Date.now() - start) + ' req/sec (average 10000 reqs)');
                   console.error( rowsReceived*1000/(Date.now() - start) + ' row/sec (average 10000 reqs)');
                   db.end();
                   if (cb) cb();
                   console.log(process.hrtime(starthr));
                   console.log(l);
               }
           });
       }
       bench();
})();

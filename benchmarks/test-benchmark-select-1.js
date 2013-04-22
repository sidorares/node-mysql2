var assert = require('assert');
var createConnection = require('../common').createConnection;

(function(cb) {
    var db = createConnection();

       var left = 10000;
       var start = Date.now();
       var prev1000 = start;
       function bench()
       {
           db.query('select 1').on('end', function(err, res) {
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
                   console.error( 10000000/(Date.now() - start) + ' req/sec (average 10000 reqs)');
                   db.end();
                   if (cb) cb();
               }
           });
       }
       bench();
})();

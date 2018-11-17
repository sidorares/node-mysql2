'use strict';

const createConnection = require('../test/common').createConnection;

const sql = process.argv[2];

(function(cb) {
  const db = createConnection();

  let left = 10000;
  const start = Date.now();
  let prev1000 = start;
  function bench() {
    db.query(sql).on('end', () => {
      left--;
      if (left % 1000 === 0) {
        const curTime = Date.now();
        const last1000time = curTime - prev1000;
        prev1000 = curTime;
        console.error(1000000 / last1000time + ' req/sec');
      }

      if (left > 0) bench();
      else {
        console.error(
          10000000 / (Date.now() - start) + ' req/sec (average 10000 reqs)'
        );
        db.end();
        if (cb) cb();
      }
    });
  }
  bench();
})();

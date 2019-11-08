'use strict';

const createConnection = require('../../test/common').createConnection;

const sql = process.argv[2];
const starthr = process.hrtime();
const haml = require('hamljs');
const fs = require('fs');

const render = haml.compile(fs.readFileSync('./views/index.haml'));

let l = 0;
let rowsReceived = 0;
let numRequests = 0;

(function(cb) {
  const db = createConnection();

  let left = 1;

  const start = Date.now();
  let prev1000 = start;
  function bench() {
    //db.query(sql).on('end', function(err, res) {
    db.query(sql, (err, res) => {
      //db.execute(sql, function(err, res) {

      rowsReceived += res.length;
      numRequests++;

      l += render({ results: res }).length;
      console.log(render({ results: res }));

      left--;
      if (left % 1000 === 0) {
        const curTime = Date.now();
        const last1000time = curTime - prev1000;
        prev1000 = curTime;
        console.error(`${1000000 / last1000time} req/sec`);
      }

      if (left > 0) bench();
      else {
        console.error(
          `${(numRequests * 1000) /
            (Date.now() - start)} req/sec (average 10000 reqs)`
        );
        console.error(
          `${(rowsReceived * 1000) /
            (Date.now() - start)} row/sec (average 10000 reqs)`
        );
        db.end();
        if (cb) cb();
        console.log(process.hrtime(starthr));
        console.log(l);
      }
    });
  }
  bench();
})();

'use strict';

const common = require('../test/common');

const Client = require('mariasql');
const connection = new Client();
connection.connect({
  host: '127.0.0.1',
  port: 3333,
  user: 'root',
  password: '',
  db: 'test'
});

function benchmarkSelect(numLeft, callback) {
  let numRows = 0;
  const q = connection.query('select 1+1 as qqq');
  q.on('result', res => {
    //console.log("result!");
    //console.log(res);

    res.on('row', () => {
      //console.log(r);
      numRows++;
    });

    res.on('end', () => {
      if (numLeft > 1) benchmarkSelect(numLeft - 1, callback);
      else callback(numRows);
    });
  });
}

function benchmarkSelects(n, cb) {
  const numSelects = 100;
  const start = process.hrtime();
  benchmarkSelect(numSelects, rowsPerQuery => {
    const end = process.hrtime();
    const diff = common.hrdiff(start, end);
    console.log(
      ' rows: ' +
        (numSelects * 1e9) / diff +
        ' results/sec, ' +
        (rowsPerQuery * numSelects * 1e9) / diff +
        ' rows/sec'
    );
    if (n > 1) benchmarkSelects(n - 1, cb);
    else cb();
  });
}

module.exports = function(done) {
  console.log('connected');
  const testStart = process.hrtime();
  benchmarkSelects(5, () => {
    const testEnd = process.hrtime();
    console.log('total time: ', common.hrdiff(testStart, testEnd) / 1e9);
    connection.end();
    if (done) done();
  });
};

connection.on('connect', module.exports);

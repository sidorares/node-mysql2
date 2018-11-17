'use strict';

const common = require('../test/common');
let connection = common.createConnection();

// ==== simple pool ===
const connections = new Array(10);
for (let i = 0; i < connections.length; ++i)
  connections[i] = common.createConnection();
let currConn = 0;
function next() {
  currConn++;
  if (currConn == connections.length) currConn = 0;
  connection = connections[currConn];
}
// ======================

function benchmarkSelect(numLeft, callback) {
  //connection.query('query from fake server fixture', function(err, result) {

  // comment if no pool:
  next();

  let rows = 0;
  const q = connection.query('query from fake server fixture');
  q.on('result', () => {
    rows++;
  });
  q.on('end', () => {
    if (numLeft > 1) benchmarkSelect(numLeft - 1, callback);
    else callback(rows);
  });
}

function benchmarkSelects(n, cb) {
  const numSelects = 100000;
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
  const testStart = process.hrtime();
  benchmarkSelects(5, () => {
    const testEnd = process.hrtime();
    console.log('total time: ', common.hrdiff(testStart, testEnd) / 1e9);
    connection.end();
    if (done) done();
  });
};

module.exports();

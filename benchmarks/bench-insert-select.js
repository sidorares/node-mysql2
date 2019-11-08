'use strict';

const common = require('../test/common');
const connection = common.createConnection();

const table = 'insert_test';
const text = '本日は晴天なり';
connection.query(
  [
    `CREATE TEMPORARY TABLE \`${table}\` (`,
    '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
    '`title` varchar(255),',
    'PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
  ].join('\n')
);

function benchmarkInsert(numLeft, callback) {
  connection.query(`INSERT INTO ${table} SET title="${text}"`, err => {
    if (err) throw err;
    if (numLeft > 1) benchmarkInsert(numLeft - 1, callback);
    else callback();
  });
}

function benchmarkInserts(n, cb) {
  const numInsert = 10000;
  const start = process.hrtime();
  benchmarkInsert(numInsert, () => {
    const end = process.hrtime();
    const diff = common.hrdiff(start, end);
    console.log(`${(numInsert * 1e9) / diff} inserts/sec`);
    if (n > 1) benchmarkInserts(n - 1, cb);
    else cb();
  });
}

function benchmarkSelect(numLeft, numSelect, callback) {
  connection.query(`select * from ${table} limit ${numSelect}`, err => {
    if (err) throw err;
    if (numLeft > 1) benchmarkSelect(numLeft - 1, numSelect, callback);
    else callback();
  });
}

function benchmarkSelects(n, size, cb) {
  const numSelects = 100;
  const start = process.hrtime();
  benchmarkSelect(numSelects, size, () => {
    const end = process.hrtime();
    const diff = common.hrdiff(start, end);
    console.log(
      `${size} rows: ${(numSelects * 1e9) / diff} results/sec, ${(size *
        numSelects *
        1e9) /
        diff} rows/sec`
    );
    if (n > 1) benchmarkSelects(n - 1, size, cb);
    else cb();
  });
}

module.exports = function(done) {
  const testStart = process.hrtime();
  benchmarkInserts(5, () => {
    benchmarkSelects(5, 10000, () => {
      benchmarkSelects(10, 1000, () => {
        benchmarkSelects(2, 50000, () => {
          const testEnd = process.hrtime();
          console.log('total time: ', common.hrdiff(testStart, testEnd) / 1e9);
          connection.end();
          if (done) done();
        });
      });
    });
  });
};

if (require.main === module) {
  module.exports();
}

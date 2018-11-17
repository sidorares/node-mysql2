'use strict';

const common = require('../test/common');
const connection = common.createConnection();

const table = 'insert_test';
//const text = "本日は晴天なり";
const text = 'test abc xyz';
connection.query('drop table ' + table).on('error', () => {});
connection.query(
  [
    'CREATE TABLE `' + table + '` (',
    '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
    '`title` varchar(255) NOT NULL,',
    'PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
  ].join('\n')
);

function benchmarkInsert(numLeft, callback) {
  connection.query(
    'INSERT INTO ' + table + ' SET title="' + text + '"',
    err => {
      if (err) throw err;
      if (numLeft > 1) benchmarkInsert(numLeft - 1, callback);
      else callback();
    }
  );
}

function benchmarkInserts(n, cb) {
  const numInsert = 50000;
  const start = process.hrtime();
  benchmarkInsert(numInsert, () => {
    const end = process.hrtime();
    const diff = common.hrdiff(start, end);
    console.log((numInsert * 1e9) / diff + ' inserts/sec');
    if (n > 1) benchmarkInserts(n - 1, cb);
    else cb();
  });
}

function benchmarkParallelSelects(n, size, cb) {
  const start = process.hrtime();
  let numRunning = 0;

  function commandDone() {
    console.log(numRunning);
    numRunning--;
    if (numRunning > 0) return;
    const end = process.hrtime();
    const diff = common.hrdiff(start, end);
    console.log(
      size +
        ' rows: ' +
        (n * 1e9) / diff +
        ' results/sec, ' +
        (size * n * 1e9) / diff +
        ' rows/sec'
    );
    cb();
  }

  const connections = new Array(n);
  for (let i = 0; i < n; ++i) {
    numRunning++;
    connections[i] = common.createConnection();
    const cmd = connections[i].execute(
      'select * from ' + table + ' limit ' + size,
      []
    );
    cmd.on('end', commandDone);
  }
}

module.exports = function(done) {
  const testStart = process.hrtime();
  benchmarkInserts(1, () => {
    benchmarkParallelSelects(8, 50000, () => {
      const testEnd = process.hrtime();
      console.log('total time: ', common.hrdiff(testStart, testEnd) / 1e9);
      if (done) done();
    });
  });
};

if (require.main === module) {
  module.exports();
}

var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

var table = 'load_data_test';
connection.query([
  'CREATE TEMPORARY TABLE `' + table + '` (',
  '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
  '`title` varchar(255),',
  'PRIMARY KEY (`id`)',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
].join('\n'));

var path = './test/fixtures/data.csv';
var sql =
  'LOAD DATA LOCAL INFILE ? INTO TABLE ' + table + ' ' +
  'FIELDS TERMINATED BY ? (id, title)';

var ok;
connection.query(sql, [path, ','], function (err, _ok) {
  if (err) {
    throw err;
  }
  ok = _ok;
});

var rows;
connection.query('SELECT * FROM ' + table, function (err, _rows) {
  if (err) {
    throw err;
  }
  rows = _rows;
});

// Try to load a file that does not exist to see if we handle this properly
var loadErr;
var loadResult;
var badPath = '/does_not_exist.csv';

connection.query(sql, [badPath, ','], function (err, result) {
  loadErr = err;
  loadResult = result;
});

// test path mapping
var Stream = require('readable-stream').PassThrough;
var myStream = new Stream();

var createMyStream = function (path) { return myStream; };
var streamResult;
connection.query({
  sql: sql,
  values: [badPath, ','],
  infileStreamFactory: createMyStream
}, function (err, result) {
  if (err) {
    throw err;
  }
  streamResult = result;
}
);
myStream.write('11,Hello World\n');
myStream.write('21,One ');
myStream.write('more row\n');
myStream.end();

connection.end();

process.on('exit', function () {
  assert.equal(ok.affectedRows, 4);
  assert.equal(rows.length, 4);
  assert.equal(rows[0].id, 1);
  assert.equal(rows[0].title, 'Hello World');

  assert.equal(loadErr.code, 'ENOENT');
  assert.equal(loadResult.affectedRows, 0);

  assert.equal(streamResult.affectedRows, 2);
});

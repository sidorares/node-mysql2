var common     = require('../../common');
var connection = common.createConnection();
var assert     = require('assert');

common.useTestDb(connection);

var table = 'nested_test';
connection.query([
  'CREATE TEMPORARY TABLE `' + table + '` (',
  '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
  '`title` varchar(255),',
  'PRIMARY KEY (`id`)',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
].join('\n'));

connection.query('INSERT INTO ' + table + ' SET ?', {title: 'test'});

var options1 = {
  nestTables: true,
  sql: 'SELECT * FROM ' + table
};
var options2 = {
  nestTables: '_',
  sql: 'SELECT * FROM ' + table
};
var options3 = {
  rowsAsArray: true,
  sql: 'SELECT * FROM ' + table
};
var rows1, rows2, rows3, rows1e, rows2e, rows3e;

connection.query(options1, function(err, _rows) {
  if (err) throw err;

  rows1 = _rows;
});

connection.query(options2, function(err, _rows) {
  if (err) throw err;

  rows2 = _rows;
});

connection.query(options3, function(err, _rows) {
  if (err) throw err;

  rows3 = _rows;
});

connection.execute(options1, function(err, _rows) {
  if (err) throw err;

  rows1e = _rows;
});

connection.execute(options2, function(err, _rows) {
  if (err) throw err;

  rows2e = _rows;
});

connection.execute(options3, function(err, _rows) {
  if (err) throw err;

  rows3e = _rows;
  connection.end();
});

process.on('exit', function() {
  assert.equal(rows1.length, 1);
  assert.equal(rows1[0].nested_test.id, 1);
  assert.equal(rows1[0].nested_test.title, 'test');
  assert.equal(rows2.length, 1);
  assert.equal(rows2[0].nested_test_id, 1);
  assert.equal(rows2[0].nested_test_title, 'test');

  assert.equal(Array.isArray(rows3[0]), true);
  assert.equal(rows3[0][0], 1);
  assert.equal(rows3[0][1], 'test');

  assert.deepEqual(rows1, rows1e);
  assert.deepEqual(rows2, rows2e);
  assert.deepEqual(rows3, rows3e);
});

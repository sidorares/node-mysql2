var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

var table = 'insert_large_test';
var content = Buffer.allocUnsafe(16777216); // 16 megabytes

connection.query([
  'CREATE TEMPORARY TABLE `' + table + '` (',
  '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
  '`content` longblob NOT NULL,',
  'PRIMARY KEY (`id`)',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
].join('\n'));

var result, result2;
connection.query('INSERT INTO ' + table + ' (content) VALUES(?)', [content], function (err, _result) {
  if (err) {
    throw err;
  }
  result = _result;
  connection.query('SELECT * FROM ' + table + ' WHERE id = ' + result.insertId, function (err, _result2) {
    result2 = _result2;
    connection.end();
  });
});

process.on('exit', function () {
  assert.strictEqual(result.insertId, 1);
  assert.strictEqual(result2.length, 1);
  // TODO: type conversions
  assert.equal(result2[0].id, String(result.insertId));
  assert.equal(result2[0].content, content);
});

var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

var table = 'insert_large_test';
var content = Buffer.allocUnsafe(19777216); // > 16 megabytes
content.fill('x', 0, 100000);
content.fill('o', 100000);

connection.query([
  'CREATE TEMPORARY TABLE `' + table + '` (',
  '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
  '`content` longblob NOT NULL,',
  'PRIMARY KEY (`id`)',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
].join('\n'));

connection.query('SET GLOBAL max_allowed_packet=56777216');

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
  assert.equal(result2[0].id, String(result.insertId));
  assert.equal(result2[0].content.toString(), content.toString());
});

var common = require('../../common');
var connection = common.createConnection();

/*
  connection.query('SELECT repeat("a", 60000000) as qqq', function (err, res) {
    console.log(err);
    console.log(err, res[0].qqq.length);
    connection.end();
  });
  return;
*/

var assert = require('assert');
var Buffer = require('safe-buffer').Buffer;

var table = 'insert_large_test';
var length = 35777416;
var content = Buffer.allocUnsafe(length); // > 16 megabytes
var content1 = Buffer.allocUnsafe(length); // > 16 megabytes

// this is to force compressed packed to be larger than uncompressed
for (var i = 0; i < content.length; ++i) {
  content[i] = Math.floor(Math.random() * 256);
  content1[i] = Math.floor(Math.random() * 256);

  // low entropy version, compressed < uncompressed
  if (i < length / 2) {
    content1[i] = 100;
  }
}

var result, result2, result3, result4;

connection.query('SET GLOBAL max_allowed_packet=' + (length * 2 + 2000), function (err, res) {
  assert.ifError(err);
  connection.end();
  var connection2 = common.createConnection();
  connection2.query([
    'CREATE TEMPORARY TABLE `' + table + '` (',
    '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,',
    '`content` longblob NOT NULL,',
    'PRIMARY KEY (`id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
  ].join('\n'));
  connection2.query('INSERT INTO ' + table + ' (content) VALUES(?)', [content], function (err, _result) {
    assert.ifError(err);
    result = _result;
    connection2.query('SELECT * FROM ' + table + ' WHERE id = ' + result.insertId, function (err, _result2) {
      result2 = _result2;
      connection2.query('INSERT INTO ' + table + ' (content) VALUES(?)', [content1], function (err, _result) {
        assert.ifError(err);
        result3 = _result;
        connection2.query('SELECT * FROM ' + table + ' WHERE id = ' + result3.insertId, function (err, _result) {
          assert.ifError(err);
          result4 = _result;
          connection2.end();
        });
      });
    });
  });
});

process.on('exit', function () {
  assert.equal(result2[0].id, String(result.insertId));
  assert.equal(result2[0].content.toString('hex'), content.toString('hex'));
  assert.equal(result4[0].content.toString('hex'), content1.toString('hex'));
});

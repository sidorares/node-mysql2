var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

var testTable = 'neg-ai-test';
var testData = 'test negative ai';

var selectResult, insertResult;

var prepareAndTest = function (cb) {
  connection.query(
    'CREATE TEMPORARY TABLE `' + testTable + '` (' +
    '`id` int(11) signed NOT NULL AUTO_INCREMENT,' +
    '`title` varchar(255),' +
    'PRIMARY KEY (`id`)' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8', testNegativeAI);
};

var testNegativeAI = function (err) {
  assert.ifError(err);
  // insert the negative AI
  connection.query(
    'INSERT INTO `' + testTable + '`' +
    ' (id, title) values (-999, "' + testData + '")'
    , function (err, result) {

      assert.ifError(err);
      insertResult = result;

      // select the row with negative AI
      connection.query('SELECT * FROM `' + testTable + '`' +
      ' WHERE id = ' + result.insertId
      ,function (err, result_) {

        assert.ifError(err);
        selectResult = result_;

        connection.end();
      });
  });
};

prepareAndTest();

process.on('exit', function () {
  assert.strictEqual(insertResult.insertId, -999);
  assert.strictEqual(selectResult.length, 1);

  assert.equal(selectResult[0].id, String(insertResult.insertId));
  assert.equal(selectResult[0].title, testData);
});

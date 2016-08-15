var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

// test data stores
var testData = [
  'ютф восемь',
  'परीक्षण',
  'test тест テスト փորձաsրկում পরীক্ষা kiểm tra',
  'ტესტი પરીક્ષણ  מבחן פּרובירן اختبار'
];

var resultData = null;

// tests

var testEncoding = function (err) {
  assert.ifError(err);

  testData.forEach(function (data) {
    connection.query(
      'INSERT INTO `test-charset-encoding` (field) values(?)',
      [data],
      function (err2) {
        assert.ifError(err2);
      });
  });

  connection.query('SELECT * from `test-charset-encoding`', function (err, results) {
    assert.ifError(err);
    resultData = results;
  });
  connection.end();
};

// init test sequence
(function () {
  connection.query(
    'CREATE TABLE IF NOT EXISTS `test-charset-encoding` ' +
    '( `field` VARCHAR(1000) CHARACTER SET latin1 COLLATE latin1_danish_ci)',
    function (err) {
      assert.ifError(err);
      connection.query('DELETE from `test-charset-encoding`', testEncoding);
    });
})();

process.on('exit', function () {
  resultData.forEach(function (data, index) {
    assert.equal(data.field, testData[index]);
  });
});

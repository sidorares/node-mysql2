var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

// test data stores
var testData = [
  'ютф восемь',
  'Experimental',
  'परीक्षण',
  'test тест テスト փորձաsրկում পরীক্ষা kiểm tra',
  'ტესტი પરીક્ષણ  מבחן פּרובירן اختبار'
];

var resultData = null;

// test inserting of non latin data if we are able to parse it

var testEncoding = function(err) {
  assert.ifError(err);

  testData.forEach(function(data) {
    connection.query(
      'INSERT INTO `test-charset-encoding` (field) values(?)',
      [data],
      function(err2) {
        assert.ifError(err2);
      }
    );
  });

  connection.query('SELECT * from `test-charset-encoding`', function(
    err,
    results
  ) {
    assert.ifError(err);
    resultData = results;
  });
  connection.end();
};

// init test sequence
(function() {
  connection.query('DROP TABLE IF EXISTS `test-charset-encoding`', function(
    err
  ) {
    connection.query(
      'CREATE TABLE IF NOT EXISTS `test-charset-encoding` ' +
        '( `field` VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)',
      function(err) {
        assert.ifError(err);
        connection.query('DELETE from `test-charset-encoding`', testEncoding);
      }
    );
  });
})();

process.on('exit', function() {
  resultData.forEach(function(data, index) {
    assert.equal(data.field, testData[index]);
  });
});

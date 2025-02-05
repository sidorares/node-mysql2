'use strict';

const common = require('../../common.test.cjs');
const connection = common.createConnection();
const { assert } = require('poku');
const process = require('node:process');

// test data stores
const testData = [
  'ютф восемь',
  'Experimental',
  'परीक्षण',
  'test тест テスト փորձաsրկում পরীক্ষা kiểm tra',
  'ტესტი પરીક્ષણ  מבחן פּרובירן اختبار',
];

let resultData = null;

// test inserting of non latin data if we are able to parse it

const testEncoding = function (err) {
  assert.ifError(err);

  testData.forEach((data) => {
    connection.query(
      'INSERT INTO `test-charset-encoding` (field) values(?)',
      [data],
      (err2) => {
        assert.ifError(err2);
      },
    );
  });

  connection.query('SELECT * from `test-charset-encoding`', (err, results) => {
    assert.ifError(err);
    resultData = results;
  });
  connection.end();
};

// init test sequence
(function () {
  connection.query('DROP TABLE IF EXISTS `test-charset-encoding`', () => {
    connection.query(
      'CREATE TABLE IF NOT EXISTS `test-charset-encoding` ' +
        '( `field` VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)',
      (err) => {
        assert.ifError(err);
        connection.query('DELETE from `test-charset-encoding`', testEncoding);
      },
    );
  });
})();

process.on('exit', () => {
  resultData.forEach((data, index) => {
    assert.equal(data.field, testData[index]);
  });
});

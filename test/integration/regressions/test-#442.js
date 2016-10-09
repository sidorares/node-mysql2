var common = require('../../common');
var connection = common.createConnection();
var assert = require('assert');

var tableName = '商城';
var testFields = ['商品类型', '商品说明', '价格', '剩余'];
var testRows = [
  ['商类型', '商品型', 47, 7],
  ['类商型', '商型品', 11, 108]
];

var actualRows = null;

connection.query([
  'CREATE TEMPORARY TABLE `' + tableName + '` (',
  ' `' + testFields[0] + '` varchar(255) NOT NULL,',
  ' `' + testFields[1] + '` varchar(255) NOT NULL,',
  ' `' + testFields[2] + '` int(11) NOT NULL,',
  ' `' + testFields[3] + '` int(11) NOT NULL,',
  ' PRIMARY KEY (`' + testFields[0] + '`)',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
].join(' '), function (err) {
  assert.ifError(err);
  connection.query([
    'INSERT INTO `' + tableName + '` VALUES',
    '("' + testRows[0][0] + '","' + testRows[0][1] + '", ' + testRows[0][2] + ', ' + testRows[0][3] + '),',
    '("' + testRows[1][0] + '","' + testRows[1][1] + '", ' + testRows[1][2] + ', ' + testRows[1][3] + ')'
  ].join(' '), executeTest);
});

function executeTest (err) {
  assert.ifError(err);
  connection.query('SELECT * FROM `' + tableName + '`', function (err, rows) {
    assert.ifError(err);
    actualRows = rows;
    connection.end();
  });
}

process.on('exit', function () {
  testRows.map(function (tRow, index) {
    var cols = testFields;
    var aRow = actualRows[index];
    assert.equal(aRow[cols[0]], tRow[0]);
    assert.equal(aRow[cols[1]], tRow[1]);
    assert.equal(aRow[cols[2]], tRow[2]);
    assert.equal(aRow[cols[3]], tRow[3]);
  });
});

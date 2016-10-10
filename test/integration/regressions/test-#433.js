var common = require('../../common');
var connection = common.createConnection({charset: 'KOI8R_GENERAL_CI'});
var assert = require('assert');

var tableName = 'МояТаблица';
var testFields = ['поле1', 'поле2', 'поле3', 'поле4'];
var testRows = [
  ['привет', 'мир', 47, 7],
  ['ура', 'тест', 11, 108]
];

var actualRows = null;
var atualError = null;

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
  connection.query('SELECT * FROM `' + tableName + '`', function (err, rows, fields) {
    assert.ifError(err);
    actualRows = rows;
    executeErrorMessageTest();
  });
}

var expectedError = "You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '`МояТаблица' at line 1";

function executeErrorMessageTest () {
  // tableName does not have closing "`", we do this to have tableName in error string
  // it is sent back in original encoding (koi8r), we are testing that it's decoded correctly
  connection.query('SELECT * FROM `' + tableName, function (err, rows, fields) {
    actualError = err.message;
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

  assert.equal(actualError, expectedError);
});

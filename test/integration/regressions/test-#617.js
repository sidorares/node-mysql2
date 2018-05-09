var common = require('../../common');
var connection = common.createConnection({ dateStrings: true });
var assert = require('assert');

var tableName = 'dates';
var testFields = ['id', 'date', 'name'];
var testRows = [
  [1, '2017-07-26 09:36:42.000', 'John'],
  [2, '2017-07-26 09:36:42.123', 'Jane']
];
var expected = [
  {
    id: 1,
    date: '2017-07-26 09:36:42',
    name: 'John'
  },
  {
    id: 2,
    date: '2017-07-26 09:36:42.123',
    name: 'Jane'
  }
];

var actualRows = null;

connection.query(
  [
    'CREATE TEMPORARY TABLE `' + tableName + '` (',
    ' `' + testFields[0] + '` int,',
    ' `' + testFields[1] + '` TIMESTAMP(3),',
    ' `' + testFields[2] + '` varchar(10)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8'
  ].join(' '),
  function(err) {
    assert.ifError(err);
    connection.query(
      [
        'INSERT INTO `' + tableName + '` VALUES',
        '(' +
          testRows[0][0] +
          ',"' +
          testRows[0][1] +
          '", "' +
          testRows[0][2] +
          '"),',
        '(' +
          testRows[1][0] +
          ',"' +
          testRows[1][1] +
          '", "' +
          testRows[1][2] +
          '")'
      ].join(' '),
      executeTest
    );
  }
);

function executeTest(err) {
  assert.ifError(err);
  connection.execute('SELECT * FROM `' + tableName + '`', function(
    err,
    rows,
    fields
  ) {
    assert.ifError(err);
    actualRows = rows;
    connection.end();
  });
}

process.on('exit', function() {
  expected.map(function(exp, index) {
    var row = actualRows[index];
    Object.keys(exp).map(function(key) {
      assert.equal(exp[key], row[key]);
    });
  });
});
